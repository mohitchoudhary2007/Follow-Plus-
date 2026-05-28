import React, { useRef, useState } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  key?: React.Key;
}

export default function SpotlightCard({
  children,
  className = "",
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className={`relative overflow-hidden premium-card group/spotlight ${className}`}
      {...props}
    >
      {/* Dynamic 3D Spotlight Core Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover/spotlight:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, rgba(223, 178, 76, 0.08), transparent 80%)`,
        }}
      />

      {/* Radiant Glowing Border effect */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover/spotlight:opacity-100"
        style={{
          padding: '1px',
          background: `radial-gradient(130px circle at ${coords.x}px ${coords.y}px, rgba(223, 178, 76, 0.35), transparent 60%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Card Content wrapper to isolate z-index */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
