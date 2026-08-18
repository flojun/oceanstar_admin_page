"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// opacity-only: translating a backdrop-blur element forces the browser to
// resample the blur every frame, which is what caused the scroll jank.
const variants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export default function Reveal({
  children,
  delay = 0,
  className,
  id,
  as: Component = motion.div,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  id?: string;
  as?: typeof motion.div;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div id={id} className={className}>{children}</div>;
  }

  return (
    <Component
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </Component>
  );
}
