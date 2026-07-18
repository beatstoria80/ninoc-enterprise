---
name: framer-motion
description: "Comprehensive guide for Motion (formerly Framer Motion) — the production-grade React animation library. Covers the full API: motion components, AnimatePresence, layout animations, scroll animations, gesture system (hover, tap, drag), hooks (useAnimate, useScroll, useInView, useSpring, useTransform, useMotionValue), variants, transitions, spring physics, performance optimization, and Next.js integration patterns. Triggers on: animate, animation, motion, framer, spring, gesture, drag, scroll animation, layout animation, exit animation, page transition, stagger, parallax, whileHover, whileTap, whileInView, AnimatePresence, useScroll, useInView, variants."
---

# Motion for React (Framer Motion) — Animation Engineering

## Initial Response

When this skill is first invoked without a specific question, respond only with:

> I'm ready to help you build production-grade React animations with Motion (formerly Framer Motion). Official docs: [motion.dev](https://motion.dev/docs/react)

Do not provide any other information until the user asks a question.

## Core Principles

### Package & Import (2025+)

Framer Motion has been **rebranded as Motion**. The `framer-motion` package is deprecated.

```bash
# Install
npm install motion
```

```tsx
// ✅ Correct (2025+)
import { motion, AnimatePresence } from "motion/react"

// ❌ Deprecated (do NOT use)
import { motion } from "framer-motion"
```

> **Migration**: The core API remains identical. Only the import path changes. Existing `framer-motion` code works via re-export, but all new code MUST use `motion/react`.

### Hybrid Animation Engine

Motion runs animations natively in the browser using the **Web Animations API (WAAPI)** and **ScrollTimeline** for 120fps performance. When those APIs can't handle the task (spring physics, interruptible keyframes, gesture tracking), it seamlessly falls back to JavaScript.

---

## The `motion` Component

The foundation of Motion. Prefix any HTML or SVG element with `motion.` to unlock animation props.

```tsx
import { motion } from "motion/react"

// Basic animation
<motion.div animate={{ opacity: 1, y: 0 }} />

// With initial state
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
/>

// Disable initial animation
<motion.button initial={false} animate={{ scale: 1 }} />
```

### Available Animation Props

| Prop | Purpose | Example |
|------|---------|---------|
| `initial` | Starting state (or `false` to skip) | `{{ opacity: 0, y: 20 }}` |
| `animate` | Target state to animate to | `{{ opacity: 1, y: 0 }}` |
| `exit` | State when removed from DOM (requires `AnimatePresence`) | `{{ opacity: 0, scale: 0.95 }}` |
| `transition` | Animation configuration | `{{ duration: 0.3, ease: "easeOut" }}` |
| `variants` | Named animation states | See Variants section |
| `whileHover` | State while hovered | `{{ scale: 1.05 }}` |
| `whileTap` | State while pressed | `{{ scale: 0.97 }}` |
| `whileFocus` | State while focused | `{{ boxShadow: "0 0 0 3px blue" }}` |
| `whileInView` | State while in viewport | `{{ opacity: 1 }}` |
| `whileDrag` | State while being dragged | `{{ scale: 1.1 }}` |
| `layout` | Auto-animate layout changes | `true` or `"position"` or `"size"` |
| `layoutId` | Shared element transitions | `"modal-card"` |

### Animatable Values

Motion can animate:
- **Transform**: `x`, `y`, `z`, `rotate`, `rotateX`, `rotateY`, `rotateZ`, `scale`, `scaleX`, `scaleY`, `skew`, `skewX`, `skewY`
- **Visual**: `opacity`, `backgroundColor`, `color`, `borderColor`, `borderRadius`, `boxShadow`
- **Layout**: `width`, `height` (use `layout` prop instead for performance)
- **Filter**: `filter`, `backdropFilter`
- **SVG**: `pathLength`, `pathOffset`, `pathSpacing`, `d`, `cx`, `cy`, `r`, `rx`, `fill`, `stroke`, `strokeWidth`
- **CSS Variables**: `"--custom-property"`

---

## Transitions

Control HOW animations play. Physical properties (x, scale) default to **spring**; visual properties (opacity, color) default to **tween**.

### Tween (Duration-based)

```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: "tween",
    duration: 0.3,
    ease: "easeOut",
    // or custom cubic bezier:
    ease: [0.23, 1, 0.32, 1],
    delay: 0.1,
  }}
/>
```

### Spring (Physics-based)

```tsx
// Apple-style (recommended — easier to reason about)
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: "spring",
    duration: 0.5,
    bounce: 0.2,
  }}
/>

// Traditional physics (more control)
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: "spring",
    mass: 1,
    stiffness: 100,
    damping: 10,
  }}
/>
```

### Per-Property Transitions

```tsx
<motion.div
  animate={{ x: 100, opacity: 1 }}
  transition={{
    x: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.2, ease: "easeOut" },
  }}
/>
```

### Repeat & Loop

```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{
    repeat: Infinity,       // or a number
    repeatType: "loop",     // "loop" | "reverse" | "mirror"
    repeatDelay: 0.5,
    duration: 2,
    ease: "linear",
  }}
/>
```

---

## Variants

Named animation states that orchestrate complex multi-element animations.

```tsx
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
}

function List() {
  return (
    <motion.ul variants={container} initial="hidden" animate="visible">
      {items.map((i) => (
        <motion.li key={i} variants={item} />
      ))}
    </motion.ul>
  )
}
```

### Stagger Pattern (Standard)

```tsx
const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,      // delay between each child
      staggerDirection: 1,         // 1 = forward, -1 = reverse
    },
  },
}
```

### Dynamic Variants

```tsx
const item = {
  hidden: (i: number) => ({
    opacity: 0,
    y: 20 * i,
  }),
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
}

<motion.div custom={index} variants={item} />
```

---

## AnimatePresence — Exit Animations

Required to animate components OUT of the React tree.

```tsx
import { motion, AnimatePresence } from "motion/react"

function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        />
      )}
    </AnimatePresence>
  )
}
```

### Key Rules
- Children MUST have a unique `key` prop
- Children MUST have an `exit` prop
- `mode="wait"` — waits for exiting component to finish before entering new one
- `mode="popLayout"` — removes exiting component from layout flow immediately
- `mode="sync"` (default) — enter and exit simultaneously

```tsx
// Page transitions with mode="wait"
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

---

## Gesture Animations

Motion's gesture system is superior to CSS `:hover` because it handles touch devices correctly.

### Hover

```tsx
<motion.button
  whileHover={{ scale: 1.05, backgroundColor: "#f0f0f0" }}
  whileTap={{ scale: 0.97 }}
  onHoverStart={() => console.log("hover start")}
  onHoverEnd={() => console.log("hover end")}
/>
```

### Tap / Press

```tsx
<motion.button
  whileTap={{ scale: 0.97 }}
  onTap={(event, info) => console.log("tapped", info.point)}
  onTapStart={() => {}}
  onTapCancel={() => {}}
/>
```

### Drag

```tsx
<motion.div
  drag                       // Enable drag on both axes
  drag="x"                   // Lock to horizontal
  drag="y"                   // Lock to vertical
  dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
  dragElastic={0.2}          // 0 = rigid, 1 = full elastic
  dragMomentum={true}        // Continue movement after release
  dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
  whileDrag={{ scale: 1.1 }}
  onDragStart={(event, info) => {}}
  onDrag={(event, info) => {}}
  onDragEnd={(event, info) => {}}
/>
```

### Focus

```tsx
<motion.input
  whileFocus={{ scale: 1.02, borderColor: "#3b82f6" }}
/>
```

---

## Layout Animations

Automatically animate any layout change (position, size) by adding the `layout` prop.

```tsx
// Auto-animate position and size changes
<motion.div layout />

// Only animate position
<motion.div layout="position" />

// Only animate size
<motion.div layout="size" />
```

### Shared Element Transitions (layoutId)

```tsx
function Card({ isExpanded, onClick }) {
  return (
    <motion.div layoutId="expandable-card" onClick={onClick}>
      <motion.h2 layoutId="card-title">Title</motion.h2>
      {isExpanded && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Expanded content
        </motion.p>
      )}
    </motion.div>
  )
}
```

### LayoutGroup

Group layout animations to prevent unrelated layout components from interfering.

```tsx
import { LayoutGroup } from "motion/react"

<LayoutGroup>
  <TabBar />
  <Content />
</LayoutGroup>
```

---

## Scroll Animations

### Scroll-Triggered (whileInView)

```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
/>
```

### Scroll-Linked (useScroll)

```tsx
import { motion, useScroll, useTransform } from "motion/react"

function ParallaxHero() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <motion.div style={{ y, opacity }}>
      <h1>Parallax Hero</h1>
    </motion.div>
  )
}
```

### Scroll Progress of Element

```tsx
function Component() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  return <motion.div ref={ref} style={{ opacity: scrollYProgress }} />
}
```

---

## Essential Hooks

### useAnimate — Imperative Control

```tsx
import { useAnimate } from "motion/react"

function Component() {
  const [scope, animate] = useAnimate()

  async function handleClick() {
    await animate(scope.current, { x: 100 }, { duration: 0.5 })
    await animate(scope.current, { rotate: 90 })
    animate(scope.current, { scale: 1.2 })
  }

  return <div ref={scope} onClick={handleClick}>Click me</div>
}
```

### useMotionValue — Reactive Values

```tsx
import { useMotionValue, useTransform, motion } from "motion/react"

function Component() {
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0])
  const background = useTransform(x, [-200, 200], ["#ff008c", "#7700ff"])

  return (
    <motion.div
      drag="x"
      style={{ x, opacity, background }}
    />
  )
}
```

### useSpring — Spring-Interpolated Values

```tsx
import { useSpring, useMotionValue } from "motion/react"

function MouseTracker() {
  const mouseX = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 100, damping: 20 })

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.clientX)}
      style={{ x: smoothX }}
    />
  )
}
```

### useInView — Viewport Detection

```tsx
import { useInView } from "motion/react"

function Component() {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
  })

  return (
    <div ref={ref} style={{ opacity: isInView ? 1 : 0 }}>
      Content
    </div>
  )
}
```

### useReducedMotion — Accessibility

```tsx
import { useReducedMotion } from "motion/react"

function Component() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={shouldReduceMotion
        ? { opacity: 1 }
        : { opacity: 1, y: 0 }
      }
      initial={shouldReduceMotion
        ? { opacity: 0 }
        : { opacity: 0, y: 20 }
      }
    />
  )
}
```

---

## Performance Rules

### 1. Hardware Acceleration Caveat

Motion's shorthand props (`x`, `y`, `scale`) use `requestAnimationFrame` on the main thread. For guaranteed hardware acceleration under load, use full `transform` strings:

```tsx
// ⚠️ NOT hardware accelerated (convenient but can drop frames under load)
<motion.div animate={{ x: 100 }} />

// ✅ Hardware accelerated (stays smooth even when main thread is busy)
<motion.div animate={{ transform: "translateX(100px)" }} />
```

**When this matters**: During heavy page loads, concurrent script execution, or complex layouts. For simple animations on non-busy pages, shorthand is fine.

### 2. Reduce Bundle Size with LazyMotion

```tsx
import { LazyMotion, domAnimation, m } from "motion/react"

// domAnimation = basic features (~17kb)
// domMax = all features including layout (~34kb)

function App() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div animate={{ opacity: 1 }} />
    </LazyMotion>
  )
}
```

### 3. Only Animate Transform & Opacity When Possible

These skip layout and paint, running on the GPU. Animating `padding`, `margin`, `height`, or `width` triggers expensive layout recalculations.

**Exception**: The `layout` prop handles width/height changes efficiently using transforms internally.

### 4. CSS Animations Beat JS Under Load

CSS animations run off the main thread. When the browser is busy loading a new page, Motion animations using `requestAnimationFrame` may drop frames while CSS animations remain smooth. Use CSS for predetermined animations; Motion for dynamic, interruptible ones.

---

## Next.js Integration Patterns

### Client Component Boundary

Motion components MUST be in Client Components:

```tsx
"use client"

import { motion } from "motion/react"

export function AnimatedCard({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  )
}
```

### Page Transitions Pattern

```tsx
// app/template.tsx
"use client"

import { motion, AnimatePresence } from "motion/react"
import { usePathname } from "next/navigation"

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

### Dynamic Import for Heavy Animations

```tsx
import dynamic from "next/dynamic"

const HeavyAnimation = dynamic(() => import("./HeavyAnimation"), {
  ssr: false,
  loading: () => <div className="skeleton" />,
})
```

---

## Common Patterns Cookbook

### Fade-in Stagger List

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
}

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((i) => (
    <motion.li key={i} variants={item}>{i}</motion.li>
  ))}
</motion.ul>
```

### Scroll-Triggered Section Reveal

```tsx
<motion.section
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-80px" }}
  transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
>
  <h2>Section Title</h2>
</motion.section>
```

### Tab Indicator with layoutId

```tsx
function Tabs({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="tab-list">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className="tab"
        >
          {tab}
          {activeTab === tab && (
            <motion.div
              layoutId="active-tab-indicator"
              className="tab-indicator"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
```

### Drag-to-Dismiss Card

```tsx
function DismissableCard({ onDismiss }) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
          onDismiss()
        }
      }}
      exit={{ opacity: 0, x: info.offset.x > 0 ? 200 : -200 }}
    >
      Swipe to dismiss
    </motion.div>
  )
}
```

### Morphing Button (Loading State)

```tsx
function SubmitButton({ isLoading }) {
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.97 }}
      transition={{ layout: { type: "spring", stiffness: 400, damping: 30 } }}
      disabled={isLoading}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Spinner />
          </motion.span>
        ) : (
          <motion.span
            key="text"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            Submit
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
```

### Scroll Progress Bar

```tsx
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      className="progress-bar"
      style={{
        scaleX: scrollYProgress,
        transformOrigin: "left",
      }}
    />
  )
}
```

---

## Quick Reference Cheat Sheet

| Task | Code |
|------|------|
| Simple animation | `<motion.div animate={{ opacity: 1 }} />` |
| Enter animation | `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />` |
| Exit animation | Wrap in `<AnimatePresence>`, add `exit` prop |
| Hover | `<motion.div whileHover={{ scale: 1.05 }} />` |
| Tap/Press | `<motion.div whileTap={{ scale: 0.97 }} />` |
| Drag | `<motion.div drag dragConstraints={ref} />` |
| Scroll trigger | `<motion.div whileInView={{ opacity: 1 }} />` |
| Scroll linked | `useScroll()` + `useTransform()` |
| Layout animation | `<motion.div layout />` |
| Shared transition | `<motion.div layoutId="shared-id" />` |
| Spring config | `transition={{ type: "spring", stiffness: 300, damping: 24 }}` |
| Stagger children | `transition={{ staggerChildren: 0.05 }}` in parent variant |
| Imperative | `const [scope, animate] = useAnimate()` |
| Reduced motion | `const reduce = useReducedMotion()` |

---

## Synergy with Other Skills

- **`emil-design-eng`**: Teaches *when* and *why* to animate. This skill teaches *how* to implement with Motion.
- **`ui-ux-pro-max`**: Provides design system recommendations. Motion brings those designs to life with animation.
- **`21st-dev`**: Provides ready-made components. Motion adds custom animations on top.

## Official Resources

- Documentation: [motion.dev/docs/react](https://motion.dev/docs/react)
- Examples: [motion.dev/examples](https://motion.dev/examples)
- Migration guide: [motion.dev/docs/react-upgrade-guide](https://motion.dev/docs/react-upgrade-guide)
