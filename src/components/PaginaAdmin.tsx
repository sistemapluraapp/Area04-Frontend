'use client'

import type { ReactNode } from 'react'
import AdminNav, { useRequireAuth } from './AdminNav'
import Grain from './Grain'
import Footer from './Footer'

export function Abas<T extends string>({ abas, atual, onChange }: { abas: { id: T; label: string }[]; atual: T; onChange: (id: T) => void }) {
  return (
    <div role="tablist" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      {abas.map((a) => (
        <button
          key={a.id}
          role="tab"
          aria-selected={atual === a.id}
          onClick={() => onChange(a.id)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.625rem',
            border: '1px solid var(--c-divider)',
            background: atual === a.id ? 'var(--c-glass-bg)' : 'transparent',
            color: atual === a.id ? 'var(--c-text-1)' : 'var(--c-text-2)',
            fontWeight: 600,
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}

export function ErroBanner({ mensagem }: { mensagem: string }) {
  if (!mensagem) return null
  return (
    <div
      role="alert"
      style={{
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        background: 'var(--c-danger-soft)',
        border: '1px solid var(--c-danger-border)',
        fontSize: '0.875rem',
        color: 'var(--c-danger-text)',
      }}
    >
      {mensagem}
    </div>
  )
}

export default function PaginaAdmin({
  atual,
  titulo,
  descricao,
  largura = 960,
  children,
}: {
  atual: string
  titulo: string
  descricao?: string
  largura?: number
  children: ReactNode
}) {
  const pronto = useRequireAuth()
  if (!pronto) return null

  return (
    <>
      <Grain />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminNav atual={atual} />
        <main style={{ flex: 1, maxWidth: `${largura}px`, margin: '0 auto', padding: '0 1.5rem 3rem', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: descricao ? '0.375rem' : '1.5rem' }}>{titulo}</h1>
          {descricao && <p style={{ color: 'var(--c-text-2)', fontSize: '0.9375rem', marginBottom: '1.5rem', maxWidth: '680px', lineHeight: 1.55 }}>{descricao}</p>}
          {children}
        </main>
        <Footer />
      </div>
    </>
  )
}
