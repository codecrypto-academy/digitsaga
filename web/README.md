This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family from Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

# UI Animation Documentation

This DAO Voting Platform uses **Framer Motion** for animations. The Treasury section (`DAOStats`) is intentionally excluded from animations as it contains auto-refreshing financial data and interactive deposit inputs.

## Animation Implementation

### Components with Animations

| Component | Animation Type |
|-----------|---------------|
| **WalletConnect** | Button hover/tap, connected state fade-in, pulsing status indicator |
| **CreateProposal** | Card entrance slide-up, form input focus transitions, loading button state |
| **ProposalList** | Staggered card entrance, vote button interactions, user vote display |

### Animation Details

#### 1. WalletConnect (`src/components/WalletConnect.tsx`)

```tsx
// Connect button - hover and tap animations
<motion.button
  whileHover={{ scale: 1.05, backgroundColor: '#2563eb' }}
  whileTap={{ scale: 0.95 }}
>

// Connected state - fade in/out with pulsing indicator
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
>

// Pulsing green dot
<motion.div
  animate={{ 
    scale: [1, 1.2, 1],
    boxShadow: [...] 
  }}
  transition={{ duration: 2, repeat: Infinity }}
>
```

#### 2. CreateProposal (`src/components/CreateProposal.tsx`)

```tsx
// Card entrance animation
<motion.div
  variants={{
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }}
  initial="hidden"
  animate="visible"
>

// Input focus animation
<motion.div whileFocus="focus">
// variants: { focus: { scale: 1.01, borderColor: '#3b82f6' } }

// Submit button with loading animation
<motion.button
  whileHover={{ backgroundColor: '#16a34a' }}
  whileTap={{ scale: 0.98 }}
>
```

#### 3. ProposalList (`src/components/ProposalList.tsx`)

```tsx
// Staggered container animation
<motion.div
  variants={{
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  }}
  initial="hidden"
  animate="visible"
>

// Individual card animation
<motion.div variants={cardVariants}>
// variants: { hidden: { opacity: 0, y: 20 }, visible: {...} }

// Vote buttons with hover/tap
<motion.button
  whileHover={...}
  whileTap={{ scale: 0.95 }}
>
```

### Custom CSS Animations

Defined in `src/app/globals.css`:

```css
@theme {
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-up: slide-up 0.4s ease-out;
  --animate-scale-in: scale-in 0.3s ease-out;
  --animate-bounce-subtle: bounce-subtle 2s ease-in-out infinite;
}
```

### Accessibility

The project respects user motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Adding More Animations

### Add a New Animation to a Component

1. Import Framer Motion:
   ```tsx
   import { motion } from 'framer-motion';
   ```

2. Define variants:
   ```tsx
   const variants = {
     hidden: { opacity: 0, y: 10 },
     visible: { opacity: 1, y: 0 }
   };
   ```

3. Apply to element:
   ```tsx
   <motion.div
     variants={variants}
     initial="hidden"
     animate="visible"
   >
     Content
   </motion.div>
   ```

### Available Animation Props

| Prop | Description |
|------|-------------|
| `initial` | Initial animation state |
| `animate` | Target animation state |
| `exit` | Exit animation state (needs `AnimatePresence`) |
| `variants` | Pre-defined animation variants |
| `transition` | Animation timing configuration |
| `whileHover` | Animation when hovering |
| `whileTap` | Animation when tapping/clicking |
| `whileFocus` | Animation when focused |

### Common Transition Values

```tsx
transition={{ 
  duration: 0.3,           // Duration in seconds
  ease: 'easeOut',        // Easing function
  delay: 0.1,             // Delay before starting
  repeat: Infinity,       // Repeat count
  repeatType: 'reverse'   // Repeat type
}}
```

## Performance Tips

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Keep micro-interaction animations at 150-300ms
- Use `will-change: transform` sparingly
- Avoid animating `width`, `height`, `top`, `left` - use `transform` instead
- Use `AnimatePresence` with `mode="wait"` for exit animations

## Dependencies

- `framer-motion` - Animation library (installed)
- Tailwind CSS v4 - Utility classes with custom animations in globals.css

## Excluded Area

The **DAO Treasury** section (`src/components/DAOStats.tsx`) does NOT have animations because:
- Displays auto-refreshing financial data (every 10 seconds)
- Contains interactive deposit form inputs
- Frequent re-renders would conflict with animation states