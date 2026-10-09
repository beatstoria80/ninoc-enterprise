# 🚨 Post-Mortem Incident Report: Mobile Opening Sequence Blocking & Hydration Flicker

## 1. Code Functionality Breakdown
The `InteractiveMascotVideo` and `HomeClientWrapper` components are responsible for the first impression of the website. They handle a 38MB mascot video playing in the background while the UI fades in. 
- **`InteractiveMascotVideo`**: Manages the `<video>` element, pointer tracking for mouse interaction on desktop, and fallback rendering on mobile.
- **`HomeClientWrapper`**: Acts as the orchestrator for the opening sequence (`scene === 'hero'`), delaying the appearance of the `MobileIntroCard` and `DesktopIntroOverlay`.
- **`NextTopLoader`**: Injected globally via `layout.tsx`, this library adds a thin, animated red progress bar across the top of the viewport when pages change.

## 2. Root Cause Analysis
The user reported a "layouting trace & scanning" blocking the page and resulting in a blank screen and a dropped user experience on mobile. 

The investigation revealed two compounding root causes:
1. **Hydration Mismatch & DOM Unmounting (The "Blank Page" Jeda):**
   In `InteractiveMascotVideo.tsx`, the component attempted to prevent hydration mismatches by conditionally rendering the `MascotMobile` component inside completely different wrapping `div` elements based on the `isMounted` and `isMobile` states:
   ```tsx
   {!isMounted ? (
     <div className="absolute inset-0 w-full h-full md:hidden">
       <MascotMobile config={config} />
     </div>
   ) : isMobile ? (
     <div className="absolute inset-0 w-full h-full">
       <MascotMobile config={config} />
     </div>
   ) : ...}
   ```
   Because the parent `<div>` changed its signature in React's virtual DOM during hydration (from `md:hidden` to no classes), React completely **unmounted** and **remounted** the `MascotMobile` component and its underlying `<video>` tag. This caused a harsh "flicker" or "blank page" delay as the video element was destroyed and recreated.

2. **Non-Native Top Loader (The "Trace & Scanning"):**
   The application included `NextTopLoader` in `layout.tsx`. On mobile devices, this 3px high red scanning line (`color="#e8527a"`) looks like a debug trace or an error scanner, contradicting the clean, premium, native-app aesthetic the brand aims for. The user accurately described this as "embel-embel tidak penting" (unimportant frills) that broke the immersion.

## 3. Failure Explanation
When a user opened the web-app on their mobile device:
1. The server rendered the HTML with the `md:hidden` wrapper and the `NextTopLoader`.
2. The browser painted the initial frame. The red "scanner" line from `NextTopLoader` appeared at the top.
3. React hydrated. `isMounted` flipped to `true`.
4. React noticed the wrapper `div` was different, so it destroyed the HTML5 `<video>` element playing the mascot.
5. The screen went completely blank (showing only the `#e3e4e7` background).
6. React mounted the new `div` and the new `<video>`, triggering a fresh load of the video stream.
7. Only after 1 second did the `MobileIntroCard` finally fade in, leaving the user confused by the preceding flashing and scanning lines.

## 4. Edge Case Analysis
- **Slow Network Connections:** If the user is on 3G, the destruction and recreation of the `<video>` element during hydration forces the browser to re-initiate the media fetch, stalling the page opening sequence even longer.
- **Desktop vs Mobile Hydration:** Desktop users didn't notice the video flicker as aggressively because desktop connections are typically faster, but they still suffered an unnecessary DOM thrashing. 
- **TopLoader Interception:** The TopLoader intercepts all `next/link` clicks and `router.push()` events. In a highly animated SPA with Framer Motion page transitions (like the transition from `hero` to `archive`), a loading bar is redundant and actively fights against the immersive Framer Motion physics.

## 5. Fixed Production-Ready Code
### Fix 1: Preventing Hydration Unmount (`InteractiveMascotVideo.tsx`)
We stabilized the DOM tree by rendering the wrapper persistently and only toggling its CSS classes (`md:hidden`, `block`, `hidden`). This ensures the `<video>` node is never destroyed by React.

```tsx
<div className={`absolute inset-0 w-full h-full ${!isMounted ? 'md:hidden' : (isMobile ? 'block' : 'hidden')}`}>
  <MascotMobile config={config} />
</div>
```

### Fix 2: Removing the Non-Native Scanner Trace (`layout.tsx`)
We completely removed `NextTopLoader` from the global layout to restore the native app feel.

```diff
- import NextTopLoader from 'nextjs-toploader';
...
- <NextTopLoader color="#e8527a" showSpinner={false} height={3} speed={100} crawlSpeed={100} easing="ease-in-out" />
```

These changes have passed QA and have been pushed to production.
