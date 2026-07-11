import { Variants } from 'framer-motion';

export const EASING = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  springBounce: { type: "spring" as const, stiffness: 300, damping: 20 },
};

export const DURATION = {
  micro: 0.05,
  fast: 0.08,
  normal: 0.12,
  medium: 0.18,
  slow: 0.3,
  hero: 0.5,
};

export const charVariants: Variants = {
  hidden: { y: 40, opacity: 0, filter: 'blur(8px)', scale: 1.05 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: { delay: 0.1 + (i * 0.03), duration: 0.8, ease: [0.23, 1, 0.32, 1] },
  }),
};

export const productCardVariants: Variants = {
  hidden: { y: 40, opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    y: 0, opacity: 1, scale: 1,
    transition: { delay: i * 0.08, duration: DURATION.medium, ease: EASING.out },
  }),
};

export const cardImageVariants: Variants = {
  hidden: { scale: 1.08, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: DURATION.slow, ease: EASING.out } },
};

export const cardContentVariants: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { delay: 0.15, duration: DURATION.medium, ease: EASING.out } },
};

export const metadataVariants: Variants = {
  hidden: { y: 60, opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    y: 0, opacity: 1, scale: 1,
    transition: { delay: 1.5 + i * 0.15, duration: 1.5, ease: [0.23, 1, 0.32, 1] },
  }),
};

export const categoryPillVariants: Variants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, x: 0, scale: 1,
    transition: { delay: 0.4 + i * 0.1, duration: DURATION.medium, ease: EASING.out },
  }),
};
