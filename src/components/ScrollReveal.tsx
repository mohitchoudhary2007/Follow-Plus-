import React from 'react';
import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  threshold?: number;
}

export default function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  duration = 0.8,
  threshold = 0.1
}: ScrollRevealProps) {
  const getVariants = () => {
    const offset = 32;
    switch (direction) {
      case 'up':
        return {
          hidden: { opacity: 0, y: offset, scale: 0.98 },
          visible: { opacity: 1, y: 0, scale: 1 }
        };
      case 'down':
        return {
          hidden: { opacity: 0, y: -offset, scale: 0.98 },
          visible: { opacity: 1, y: 0, scale: 1 }
        };
      case 'left':
        return {
          hidden: { opacity: 0, x: offset, scale: 0.98 },
          visible: { opacity: 1, x: 0, scale: 1 }
        };
      case 'right':
        return {
          hidden: { opacity: 0, x: -offset, scale: 0.98 },
          visible: { opacity: 1, x: 0, scale: 1 }
        };
      default:
        return {
          hidden: { opacity: 0, scale: 0.98 },
          visible: { opacity: 1, scale: 1 }
        };
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.16, 1, 0.3, 1] // Elite cubic bezier luxury ease curve
      }}
      variants={getVariants()}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
