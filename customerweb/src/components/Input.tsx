import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  helperText?: string;
  className?: string;
}

export default function Input({
  label,
  error,
  icon,
  iconPosition = 'left',
  helperText,
  className = '',
  ...props
}: InputProps) {
  const hasError = !!error;

  return (
    <div className="w-full">
      {label && <label className="block text-gray-300 font-medium mb-2 text-sm">{label}</label>}
      <div className="relative">
        {icon && (
          <span className={`absolute top-1/2 -translate-y-1/2 text-gray-500 ${iconPosition === 'left' ? 'left-4' : 'right-4'}`}>
            {icon}
          </span>
        )}
        <input
          className={`
            w-full bg-brand-gray/50 text-white border rounded-xl px-4 py-3 text-base
            transition-all duration-200
            focus:outline-none focus:bg-brand-gray
            ${hasError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50'}
            ${icon && iconPosition === 'left' ? 'pl-12' : ''}
            ${icon && iconPosition === 'right' ? 'pr-12' : ''}
            placeholder:text-gray-600
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      {helperText && !error && <p className="text-gray-500 text-xs mt-1.5">{helperText}</p>}
    </div>
  );
}
