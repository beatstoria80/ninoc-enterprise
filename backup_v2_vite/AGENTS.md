# Responsive Design Consistency Rules

- **Strict Isolation**: When modifying the UI for mobile screens, always use Tailwind responsive prefixes (e.g., `max-sm:`, `sm:`, `md:`) to ensure changes do not bleed into the desktop (PC) view unintentionally.
- **PC vs. Mobile Balance**: Any aesthetic change (e.g., "minimalist icons") should be applied thoughtfully across both views, but size and layout adjustments must be scoped to their respective breakpoints.
- **No Side Effects**: Before finalizing an edit, mentally verify (or check via linting/compiling) that a fix for mobile doesn't revert a desktop layout fix, and vice versa.
- **Breakpoint Precision**: Desktop adjustments should generally target `md:` and above, while mobile adjustments should target the base classes or `max-sm:`.
