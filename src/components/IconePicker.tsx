'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconSearch, IconX } from '@tabler/icons-react'
import Icone, { CHAVES_ICONES } from './Icone'

// Seletor de ícone da biblioteca Tabler. Grava a chave em kebab-case
// (ex.: 'wheelchair'), que as outras áreas renderizam com <Icone nome=... />.
export default function IconePicker({
  valor,
  onChange,
  rotulo = 'Escolher ícone',
}: {
  valor: string | null
  onChange: (icone: string) => void
  rotulo?: string
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')

  const chaves = useMemo(() => {
    const t = busca.trim().toLowerCase()
    return t ? CHAVES_ICONES.filter((k) => k.includes(t)) : CHAVES_ICONES
  }, [busca])

  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        title={valor ? `${rotulo} (atual: ${valor})` : rotulo}
        aria-label={rotulo}
        style={{
          width: '2.25rem',
          height: '2.25rem',
          flexShrink: 0,
          borderRadius: '0.625rem',
          border: '1px solid var(--c-input-border)',
          background: 'var(--c-accent-soft)',
          color: 'var(--c-accent-text)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icone nome={valor} size={18} />
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={rotulo}
          onClick={() => setAberto(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 10050, background: 'var(--c-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: 'var(--c-modal-bg)', border: 'var(--c-border)', borderRadius: '1.25rem', boxShadow: 'var(--c-shadow-lg)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--c-divider)' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', display: 'flex' }}>
                  <IconSearch size={16} />
                </span>
                <input
                  autoFocus
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar ícone (em inglês: wheelchair, eye, dog…)"
                  style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem', borderRadius: '0.625rem', border: '1px solid var(--c-input-border)', background: 'var(--c-input-bg)', color: 'var(--c-input-text)', fontSize: '0.875rem', fontFamily: 'inherit' }}
                />
              </div>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" style={{ background: 'none', border: 'none', color: 'var(--c-text-2)', cursor: 'pointer', display: 'flex' }}>
                <IconX size={20} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: '0.5rem' }}>
              {chaves.map((k) => {
                const ativo = k === valor
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      onChange(k)
                      setAberto(false)
                    }}
                    title={k}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.625rem 0.25rem',
                      borderRadius: '0.75rem',
                      border: ativo ? '1px solid var(--c-accent-soft-border)' : '1px solid var(--c-divider)',
                      background: ativo ? 'var(--c-accent-soft)' : 'transparent',
                      color: ativo ? 'var(--c-accent-text)' : 'var(--c-text-1)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Icone nome={k} size={22} />
                    <span style={{ fontSize: '0.625rem', color: 'var(--c-text-3)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k}</span>
                  </button>
                )
              })}
              {chaves.length === 0 && <p style={{ gridColumn: '1 / -1', color: 'var(--c-text-3)', fontSize: '0.875rem' }}>Nenhum ícone encontrado.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
