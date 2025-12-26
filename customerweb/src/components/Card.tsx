import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glowing?: boolean;
}

export default function Card({ children, className = '', hoverable = false, glowing = false }: CardProps) {
  const baseStyles = 'rounded-2xl p-6 border transition-all duration-300';
  const borderStyles = glowing ? 'border-brand-yellow/30 shadow-lg shadow-brand-yellow/10' : 'border-white/5';
  const interactiveStyles = hoverable ? 'hover:border-brand-yellow/30 hover:shadow-lg hover:-translate-y-1' : '';

  return (
    <div className={`${baseStyles} bg-brand-dark ${borderStyles} ${interactiveStyles} ${className}`}>
      {children}
    </div>
  );
}
