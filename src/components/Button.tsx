'use client'

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #1a7aff 0%, #0062e6 100%)',
    color: '#ffffff',
    border: '1px solid rgba(26,122,255,0.60)',
    boxShadow: '0 4px 16px rgba(26,122,255,0.30), inset 0 1px 0 rgba(255,255,255,0.20)',
  },
  secondary: {
    background: 'var(--c-btn-secondary-bg)',
    backdropFilter: 'blur(16px)',
    color: 'var(--c-btn-secondary-text)',
    border: '1px solid var(--c-btn-secondary-border)',
    boxShadow: 'var(--c-shadow-sm)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--c-btn-ghost-text)',
    border: '1px solid var(--c-btn-ghost-border)',
  },
  danger: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#ffffff',
    border: '1px solid rgba(239,68,68,0.60)',
    boxShadow: '0 4px 16px rgba(239,68,68,0.30)',
  },
}

const sizeStyles: Record<Size, CSSProperties> = {
  sm: { padding: '0.375rem 0.875rem', fontSize: '0.8125rem', borderRadius: '0.5rem' },
  md: { padding: '0.625rem 1.25rem', fontSize: '0.9375rem', borderRadius: '0.75rem' },
  lg: { padding: '0.875rem 1.75rem', fontSize: '1.0625rem', borderRadius: '1rem' },
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  style,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}) {
  const isDisabled = disabled || loading

  return (
    <button
      {...rest}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease',
        outline: 'none',
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) e.currentTarget.style.transform = ''
      }}
    >
      {loading && (
        <span
          style={{
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      )}
      {!loading && icon}
      {children}
    </button>
  )
}
