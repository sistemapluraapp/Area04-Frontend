'use client'

import type { CSSProperties, ReactNode } from 'react'

type Variant = 'default' | 'sm' | 'lg' | 'blue'

const variantClass: Record<Variant, string> = {
  default: 'glass',
  sm: 'glass-sm',
  lg: 'glass-lg',
  blue: 'glass-blue',
}

export default function GlassCard({
  children,
  variant = 'default',
  className = '',
  style,
  onClick,
  hoverable = false,
}: {
  children: ReactNode
  variant?: Variant
  className?: string
  style?: CSSProperties
  onClick?: () => void
  hoverable?: boolean
}) {
  return (
    <div
      className={`${variantClass[variant]} ${className}`}
      style={{
        padding: '1.5rem',
        transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms cubic-bezier(0.4,0,0.2,1)',
        cursor: onClick || hoverable ? 'pointer' : undefined,
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
          e.currentTarget.style.boxShadow = '0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.20)'
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.transform = ''
          e.currentTarget.style.boxShadow = ''
        }
      }}
    >
      {children}
    </div>
  )
}
