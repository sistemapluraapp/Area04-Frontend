'use client'

import { useEffect, useState } from 'react'
import { IconMoon, IconSun } from '@tabler/icons-react'
import { aplicarModo, obterModo, type Modo } from '@/lib/modo'

export default function ModoToggle() {
  const [modo, setModo] = useState<Modo>('claro')

  useEffect(() => {
    setModo(obterModo())
    const aoMudar = (e: Event) => setModo((e as CustomEvent<Modo>).detail)
    window.addEventListener('plura-modo', aoMudar)
    return () => window.removeEventListener('plura-modo', aoMudar)
  }, [])

  const proximo: Modo = modo === 'escuro' ? 'claro' : 'escuro'

  return (
    <button
      type="button"
      onClick={() => aplicarModo(proximo)}
      aria-label={proximo === 'escuro' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      title={proximo === 'escuro' ? 'Modo escuro' : 'Modo claro'}
      style={{
        width: '38px',
        height: '38px',
        borderRadius: '0.75rem',
        border: '1px solid var(--c-input-border)',
        background: 'var(--c-glass-bg-sm)',
        color: 'var(--c-text-1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {modo === 'escuro' ? <IconSun size={18} stroke={1.8} /> : <IconMoon size={18} stroke={1.8} />}
    </button>
  )
}
