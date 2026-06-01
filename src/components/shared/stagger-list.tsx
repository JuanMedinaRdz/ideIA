"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wrapper para animar entrada de listas con stagger sutil. Cada hijo aparece
 * 30ms después del anterior — el ojo percibe el orden sin que se sienta lento.
 *
 * Si el usuario tiene `prefers-reduced-motion: reduce`, omitimos la animación
 * completamente. Tener animaciones "casi nada" no es lo mismo que no tenerlas
 * — para alguien con sensibilidad vestibular o TDAH severo, cualquier
 * movimiento es ruido.
 */
export function StaggerList({
  children,
  className,
}: {
  children: ReactNode[];
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.03 } },
      }}
    >
      {children.map((child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 4 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
