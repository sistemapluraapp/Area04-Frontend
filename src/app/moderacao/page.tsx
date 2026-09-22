'use client'

import { useEffect, useState } from 'react'
import AdminNav, { useRequireAuth } from '@/components/AdminNav'
import GlassCard from '@/components/GlassCard'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import { AlertIcon } from '@/components/icons'
import { api, type AvaliacaoSinalizada } from '@/lib/api'

type Aba = 'todas' | 'sinalizadas'

const ABAS: { id: Aba; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'sinalizadas', label: 'Sinalizadas' },
]

export default function ModeracaoPage() {
  const pronto = useRequireAuth()
  const [aba, setAba] = useState<Aba>('todas')
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoSinalizada[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!pronto) return
    setCarregando(true)
    setErro('')
    const chamada = aba === 'todas' ? api.avaliacoesTodas() : api.avaliacoesSinalizadas()
    chamada
      .then((r) => setAvaliacoes(r.avaliacoes))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar avaliações'))
      .finally(() => setCarregando(false))
  }, [pronto, aba])

  if (!pronto) return null

  return (
    <>
      <Grain />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminNav atual="/moderacao" />
        <main style={{ flex: 1, maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem 3rem', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Moderação de avaliações
          </h1>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {ABAS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.625rem',
                  border: '1px solid var(--c-divider)',
                  background: aba === a.id ? 'var(--c-glass-bg)' : 'transparent',
                  color: aba === a.id ? 'var(--c-text-1)' : 'var(--c-text-2)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>

          {erro && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                fontSize: '0.875rem',
                color: '#f87171',
              }}
            >
              {erro}
            </div>
          )}

          {carregando && <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>}

          {!carregando && avaliacoes.length === 0 && !erro && (
            <p style={{ color: 'var(--c-text-3)' }}>
              {aba === 'todas' ? 'Nenhuma avaliação encontrada.' : 'Nenhuma avaliação sinalizada no momento.'}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {avaliacoes.map((a) => (
              <GlassCard key={a.id} style={{ padding: '1.25rem' }}>
                {a.sinalizada && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#fbbf24' }}>
                    <AlertIcon />
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Sinalizada
                    </span>
                  </div>
                )}
                <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{a.pagina_nome}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)', marginBottom: '0.5rem' }}>Nota: {a.nota}/5</p>
                {a.comentario && <p style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>&ldquo;{a.comentario}&rdquo;</p>}
                {a.resposta && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--c-text-3)', borderLeft: '2px solid var(--c-divider)', paddingLeft: '0.75rem' }}>
                    Resposta: {a.resposta}
                  </p>
                )}
              </GlassCard>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
