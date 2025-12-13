// Basic Input component with sharp design (0-2px radius)
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  style,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2 border bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-[var(--color-weak)] focus:ring-[var(--color-weak)]'
            : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]'
        } ${className}`}
        style={{ borderRadius: 'var(--radius-sm)', ...style }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-[var(--color-weak)]">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{helperText}</p>
      )}
    </div>
  );
}
