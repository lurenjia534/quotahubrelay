export const materialEmphasized = [0.2, 0, 0, 1] as [
  number,
  number,
  number,
  number,
];

export const materialEmphasizedDecelerate = [0.05, 0.7, 0.1, 1] as [
  number,
  number,
  number,
  number,
];

export const materialEmphasizedAccelerate = [0.3, 0, 0.8, 0.15] as [
  number,
  number,
  number,
  number,
];

export const materialSpring = {
  type: "spring" as const,
  visualDuration: 0.46,
  bounce: 0.18,
};

export const materialFastSpatial = {
  type: "spring" as const,
  visualDuration: 0.24,
  bounce: 0.08,
};

export const materialDefaultSpatial = {
  type: "spring" as const,
  visualDuration: 0.42,
  bounce: 0.14,
};

export const materialHeroSpatial = {
  type: "spring" as const,
  visualDuration: 0.58,
  bounce: 0.18,
};

export const materialFastEffects = {
  duration: 0.16,
  ease: materialEmphasizedDecelerate,
};

export const materialDefaultEffects = {
  duration: 0.28,
  ease: materialEmphasized,
};

export const materialEnterTransition = {
  default: materialSpring,
  opacity: {
    duration: 0.24,
    ease: materialEmphasizedDecelerate,
  },
};

export const materialExitTransition = {
  default: {
    duration: 0.18,
    ease: materialEmphasizedAccelerate,
  },
  opacity: {
    duration: 0.14,
    ease: materialEmphasizedAccelerate,
  },
};

export const expressiveContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.03,
      staggerChildren: 0.07,
    },
  },
};

export const expressiveItem = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    y: 18,
  },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: materialEnterTransition,
  },
};

export const expressiveListItem = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    y: 12,
  },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: materialEnterTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    x: -16,
    transition: materialExitTransition,
  },
};

export const materialSurfaceHover = {
  scale: 1.004,
  transition: materialFastSpatial,
};

export const materialRowHover = {
  scale: 1.002,
  x: 2,
  transition: materialFastSpatial,
};

export const materialHeroSurfaceHover = {
  scale: 1.008,
  transition: materialDefaultSpatial,
};

export const materialPress = {
  scale: 0.985,
  transition: {
    type: "spring" as const,
    visualDuration: 0.14,
    bounce: 0.04,
  },
};

export const materialIconPress = {
  scale: 0.94,
  transition: {
    type: "spring" as const,
    visualDuration: 0.14,
    bounce: 0.04,
  },
};
