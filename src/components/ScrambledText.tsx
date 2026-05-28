import { useEffect, useState } from 'react';

interface ScrambledTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  triggerOnMount?: boolean;
}

export default function ScrambledText({
  text,
  speed = 30,
  delay = 0,
  className = "",
  triggerOnMount = true
}: ScrambledTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ★⚡✦♛⚜💎✵0123456789";

  const triggerScramble = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    let iteration = 0;
    
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (index < iteration) {
              return text[index];
            }
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
        setIsAnimating(false);
      }
      iteration += 1 / 3;
    }, speed);
  };

  useEffect(() => {
    if (triggerOnMount) {
      const t = setTimeout(() => {
        triggerScramble();
      }, delay);
      return () => clearTimeout(t);
    }
  }, [text]);

  return (
    <span 
      className={`cursor-default select-none relative group/scramble ${className}`}
      onMouseEnter={triggerScramble}
    >
      {displayText}
      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-[#dfb24c] to-[#f4d081] transition-all duration-300 group-hover/scramble:w-full" />
    </span>
  );
}
