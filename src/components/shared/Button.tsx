// Basic Button component with sharp design (2-4px radius)
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:ring-[var(--color-primary)] disabled:opacity-50',
    secondary: 'text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] focus:ring-[var(--color-border)] disabled:opacity-50',
    danger: 'text-white bg-[var(--color-weak)] hover:opacity-90 focus:ring-[var(--color-weak)] disabled:opacity-50',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={{ borderRadius: 'var(--radius-button)', ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
