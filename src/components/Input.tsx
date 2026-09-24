'use client'

import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export default function Input({ label, helperText, error, leadingIcon, trailingIcon, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false)

  const borderColor = error ? 'var(--c-input-error-border)' : focused ? 'var(--c-input-focus-border)' : 'var(--c-input-border)'
  const boxShadow = error
    ? '0 0 0 3px var(--c-input-error-ring)'
    : focused
      ? '0 0 0 3px var(--c-input-focus-ring), var(--c-shadow-sm)'
      : 'none'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {label && (
        <label
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: error ? 'var(--c-input-error-label)' : 'var(--c-input-label)',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leadingIcon && (
          <span
            style={{
              position: 'absolute',
              left: '0.875rem',
              color: focused ? 'var(--c-input-icon-focus)' : 'var(--c-input-icon)',
              display: 'flex',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            {leadingIcon}
          </span>
        )}

        <input
          {...rest}
          onFocus={(e) => {
            setFocused(true)
            rest.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            rest.onBlur?.(e)
          }}
          style={{
            width: '100%',
            padding: `0.625rem ${trailingIcon ? '2.75rem' : '1rem'} 0.625rem ${leadingIcon ? '2.75rem' : '1rem'}`,
            background: 'var(--c-input-bg)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${borderColor}`,
            borderRadius: '0.75rem',
            color: 'var(--c-input-text)',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
            boxShadow,
            ...style,
          }}
        />

        {trailingIcon && (
          <span
            style={{
              position: 'absolute',
              right: '0.875rem',
              color: focused ? 'var(--c-input-icon-focus)' : 'var(--c-input-icon)',
              display: 'flex',
            }}
          >
            {trailingIcon}
          </span>
        )}
      </div>

      {(error || helperText) && (
        <span style={{ fontSize: '0.8125rem', color: error ? 'var(--c-input-error-text)' : 'var(--c-input-helper)' }}>
          {error ?? helperText}
        </span>
      )}
    </div>
  )
}
