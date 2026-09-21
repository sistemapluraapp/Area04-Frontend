'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { limparSessao, obterUsuarioSalvo, estaLogado } from '@/lib/auth'
import { LOGO_DATA_URI } from '@/lib/logo'
import NotificationBell from './NotificationBell'

const LINKS = [
  { href: '/dashboard', label: 'Indicadores' },
  { href: '/contas', label: 'Contas' },
  { href: '/moderacao', label: 'Moderação' },
  { href: '/certificados', label: 'Certificados' },
  { href: '/convites-gov', label: 'Convites Gov' },
]

export function useRequireAuth() {
  const router = useRouter()
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    if (!estaLogado()) {
      router.replace('/login')
      return
    }
    setPronto(true)
  }, [router])

  return pronto
}

export default function AdminNav({ atual }: { atual: string }) {
  const router = useRouter()
  const usuario = obterUsuarioSalvo()

  function sair() {
    limparSessao()
    router.push('/login')
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--c-divider)',
        marginBottom: '2rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_DATA_URI} alt="Plura" style={{ height: '28px', width: 'auto' }} draggable={false} />
        <nav style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: atual === l.href ? 'var(--c-text-blue)' : 'var(--c-text-2)',
                textDecoration: 'none',
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <NotificationBell />
        {usuario && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>{usuario.nome ?? usuario.email}</span>
        )}
        <button
          onClick={sair}
          style={{
            background: 'none',
            border: '1px solid var(--c-divider)',
            borderRadius: '0.5rem',
            padding: '0.375rem 0.875rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--c-text-2)',
            cursor: 'pointer',
          }}
        >
          Sair
        </button>
      </div>
    </header>
  )
}
