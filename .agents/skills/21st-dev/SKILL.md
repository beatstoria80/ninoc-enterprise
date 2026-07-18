---
name: 21st-dev
description: "Integration guide for 21st.dev — the open-source React component registry and marketplace. Copy-paste philosophy like shadcn/ui. Covers: CLI commands (search, add, publish), component discovery workflow, AI agent integration, project setup, customization best practices, and compatibility with shadcn/ui, Tailwind CSS, and Radix UI. Triggers on: component library, UI components, component registry, 21st, ready-made components, pre-built components, copy paste components, shadcn alternative, component marketplace, install component."
---

# 21st.dev — React Component Registry

## Initial Response

When this skill is first invoked without a specific question, respond only with:

> I'm ready to help you find and integrate high-quality React components from 21st.dev. Browse the registry: [21st.dev](https://21st.dev)

Do not provide any other information until the user asks a question.

## What is 21st.dev?

21st.dev is a **community-driven registry** of high-quality, hand-crafted React UI components. Think of it as the "npm for UI components" with a **copy-paste philosophy** — you own the source code, not a black-box dependency.

### Key Characteristics

| Feature | Description |
|---------|-------------|
| **Philosophy** | Copy source code into your project (like shadcn/ui) |
| **Tech Stack** | React, Tailwind CSS, Radix UI primitives |
| **Ownership** | Full source code control — customize freely |
| **AI-Ready** | Optimized for AI coding agents (Cursor, Claude, Gemini) |
| **Quality** | Community-verified, production-ready components |

### Why Use 21st.dev?

- **Speed**: Skip building standard UI elements from scratch
- **Quality**: Components built by experienced design engineers
- **Consistency**: Maintain UI consistency across projects
- **Freedom**: No vendor lock-in — code lives in YOUR repository
- **Modern**: Components follow latest React/Next.js best practices

---

## CLI Setup & Commands

### Quick Start (No Install)

Use `npx` to run commands without global installation:

```bash
# Search for components
npx @21st-dev/cli search "pricing table"

# Add a component to your project
npx @21st-dev/cli add <author/component-slug>
```

### Global Installation (Recommended for Frequent Use)

```bash
# Install CLI globally
npm i -g @21st-dev/cli

# Authenticate (opens browser)
21st login

# Core commands
21st search "hero section"
21st add <author/component-slug>
21st publish ./my-component.tsx
```

### CLI Command Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `search "<query>"` | Find components by keyword | `21st search "navigation sidebar"` |
| `add <author/slug>` | Install component into project | `21st add johndoe/animated-card` |
| `publish <file>` | Share your component with community | `21st publish ./src/components/HeroSection.tsx` |
| `login` | Authenticate for API access | `21st login` |

### With API Key (For CI/CD & Agents)

```bash
npx @21st-dev/cli add @scope/component-name?api_key=$API_KEY_21ST
```

---

## Workflow: Using 21st.dev in Your Project

### Step 1: Identify What You Need

Before searching, break down the UI into components:

```
Landing Page → Hero, Features, Pricing, Testimonials, Footer
Dashboard   → Sidebar, Stats Cards, Charts, Data Table, Header
E-commerce  → Product Card, Cart Drawer, Checkout Form, Filters
```

### Step 2: Search for Components

```bash
# Search by component type
21st search "hero section dark"
21st search "pricing table gradient"
21st search "animated card hover"
21st search "sidebar navigation collapsible"
21st search "testimonial carousel"

# Search by style
21st search "glassmorphism card"
21st search "bento grid layout"
21st search "gradient button"
```

### Step 3: Add to Project

```bash
# Create a new branch (always recommended before adding components)
git checkout -b feat/add-21st-components

# Add the component
21st add author/component-slug

# The CLI will:
# 1. Download the component source code
# 2. Place it in your components directory
# 3. Install any required dependencies
```

### Step 4: Customize to Match Your Design System

After installing a component, ALWAYS customize it to match your project's design system:

```tsx
// BEFORE: Default 21st.dev component
<Card className="bg-white rounded-lg shadow-md p-6">

// AFTER: Customized for your design system
<Card className="bg-card rounded-xl shadow-ninoc p-8 border border-border">
```

**Customization checklist:**
- [ ] Replace default colors with your design tokens
- [ ] Update font families and sizes to match your typography
- [ ] Adjust spacing/padding to your grid system
- [ ] Update border-radius to match your design language
- [ ] Add your brand's animation timing (refer to `framer-motion` skill)
- [ ] Ensure dark mode compatibility
- [ ] Test responsive behavior at all breakpoints

### Step 5: Test & Commit

```bash
# Verify the component renders correctly
npm run dev

# Lint check
npm run lint

# Commit
git add .
git commit -m "feat: add [component-name] from 21st.dev"
git push origin feat/add-21st-components
```

---

## Component Categories

### Common Component Types on 21st.dev

| Category | Examples | Search Keywords |
|----------|----------|-----------------|
| **Navigation** | Navbar, Sidebar, Breadcrumbs, Tab Bar | `"navbar floating"`, `"sidebar collapsible"` |
| **Hero Sections** | Landing heroes, Split layouts, Video heroes | `"hero gradient"`, `"hero split image"` |
| **Cards** | Feature cards, Pricing cards, Team cards | `"card hover effect"`, `"bento card"` |
| **Forms** | Login, Signup, Contact, Multi-step | `"login form modern"`, `"multi-step form"` |
| **Modals & Dialogs** | Confirmation, Full-screen, Drawer | `"modal animated"`, `"drawer bottom sheet"` |
| **Tables** | Data tables, Sortable, Filterable | `"data table sortable"`, `"table pagination"` |
| **Marketing** | Testimonials, FAQ, CTA, Social proof | `"testimonial carousel"`, `"faq accordion"` |
| **Pricing** | Pricing tables, Comparison, Toggle | `"pricing toggle annual"`, `"pricing gradient"` |
| **Buttons** | Primary, Ghost, Gradient, Animated | `"button gradient shine"`, `"button loading"` |
| **Backgrounds** | Animated, Gradient, Particles | `"animated background"`, `"gradient mesh"` |

---

## AI Agent Integration

### Adding 21st.dev to Agent Rules

For projects that frequently use 21st.dev, add this to your `.agents/AGENTS.md` or equivalent:

```markdown
## Component Discovery Rule

When building new UI components, always check 21st.dev first:
1. Search: `npx @21st-dev/cli search "<component description>"`
2. If a suitable component exists, install it instead of building from scratch
3. Always customize installed components to match the project's design system
4. Document the source component in a code comment
```

### Prompt Pattern for Agent-Driven Development

When asking an AI agent to build UI, use this pattern:

```
"Build a [component type] for [project]. 
Check 21st.dev for a [style] version first. 
If found, install and customize it to match our design system.
If not found, build it from scratch following our design guidelines."
```

---

## Compatibility & Dependencies

### Required Stack

| Dependency | Minimum Version | Notes |
|-----------|----------------|-------|
| React | 18+ | Required |
| Tailwind CSS | 3.x or 4.x | Most components use Tailwind |
| TypeScript | 5.x | Recommended (most components are typed) |

### Common Peer Dependencies

Components from 21st.dev may require these packages. Install as needed:

```bash
# UI Primitives (most common)
npm install @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-tooltip

# Animation
npm install motion
# or: npm install framer-motion

# Icons
npm install lucide-react

# Utilities
npm install clsx tailwind-merge class-variance-authority
```

### shadcn/ui Compatibility

Most 21st.dev components are designed to work alongside shadcn/ui:
- They use the same `cn()` utility pattern
- They respect the same CSS variable theming system
- They follow the same file structure conventions

```tsx
// cn() utility (standard pattern)
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Best Practices

### DO ✅

- **Branch before installing** — Always create a Git branch before adding components
- **Customize after installing** — Match components to your design system
- **Document the source** — Add a comment noting where the component came from
- **Check dependencies** — Verify new deps don't conflict with existing ones
- **Test responsiveness** — Verify the component works at all breakpoints
- **Review the source** — Understand the code before integrating

### DON'T ❌

- **Don't use as black-box** — You own the code, understand it
- **Don't skip customization** — Default styles will clash with your design
- **Don't install without testing** — Some components may have peer dependency issues
- **Don't keep unused dependencies** — Clean up after removing components
- **Don't mix component library styles** — Stay consistent with one design system

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| CLI fails to add component | Check internet connection; try `npx @21st-dev/cli@latest add ...` |
| Missing dependencies after install | Read the component file imports, install missing packages |
| Style conflicts | Check for CSS specificity issues; verify Tailwind config |
| TypeScript errors | Install `@types/` packages for missing type definitions |
| Component not rendering | Check that all peer dependencies are installed |

---

## Synergy with Other Skills

- **`ui-ux-pro-max`**: Generates design system recommendations → Use 21st.dev to find matching components
- **`framer-motion`**: Add production-grade animations to installed components
- **`emil-design-eng`**: Apply animation philosophy and interaction polish to 21st.dev components

## Resources

- Registry: [21st.dev](https://21st.dev)
- CLI Docs: [21st.dev/docs/cli](https://21st.dev/docs/cli)
- GitHub: [github.com/21st-dev](https://github.com/21st-dev)
