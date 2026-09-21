'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, type Notificacao } from '@/lib/api'
import { BellIcon } from './icons'
import GlassCard from './GlassCard'
import Button from './Button'

const POLL_INTERVAL_MS = 60_000

function formatarData(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function NotificationBell() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [aberto, setAberto] = useState(false)
  const [total, setTotal] = useState(0)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [carregando, setCarregando] = useState(false)

  const atualizarContagem = useCallback(async () => {
    try {
      const { total } = await api.contarNaoLidas()
      setTotal(total)
    } catch {
      // silencioso: falha ao contar não deve quebrar a navegação
    }
  }, [])

  useEffect(() => {
    atualizarContagem()
    const id = setInterval(atualizarContagem, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [atualizarContagem])

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  async function abrirPainel() {
    const novoEstado = !aberto
    setAberto(novoEstado)
    if (novoEstado) {
      setCarregando(true)
      try {
        const { notificacoes } = await api.listarNotificacoes()
        setNotificacoes(notificacoes)
      } catch {
        setNotificacoes([])
      } finally {
        setCarregando(false)
      }
    }
  }

  async function clicarNotificacao(n: Notificacao) {
    if (!n.lida) {
      setNotificacoes((prev) => prev.map((x) => (x.id === n.id ? { ...x, lida: true } : x)))
      setTotal((prev) => Math.max(0, prev - 1))
      try {
        await api.marcarNotificacaoComoLida(n.id)
      } catch {
        // mantém o estado local mesmo se a chamada falhar
      }
    }

    if (n.tipo === 'avaliacao_sinalizada') {
      setAberto(false)
      router.push('/moderacao')
    }
  }

  async function marcarTodasComoLidas() {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
    setTotal(0)
    try {
      await api.marcarTodasNotificacoesComoLidas()
    } catch {
      // mantém o estado local mesmo se a chamada falhar
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={abrirPainel}
        aria-label="Notificações"
        style={{
          position: 'relative',
          background: 'none',
          border: '1px solid var(--c-divider)',
          borderRadius: '0.5rem',
          padding: '0.4375rem 0.5625rem',
          color: 'var(--c-text-2)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <BellIcon />
        {total > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              borderRadius: '999px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.625rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {aberto && (
        <div style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0, zIndex: 50, width: '360px' }}>
          <GlassCard style={{ padding: '1rem', maxHeight: '420px', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--c-text-1)' }}>Notificações</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={marcarTodasComoLidas}
                disabled={notificacoes.every((n) => n.lida) && total === 0}
                style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
              >
                Marcar todas como lidas
              </Button>
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {carregando && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>Carregando…</span>
              )}
              {!carregando && notificacoes.length === 0 && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
                  Nenhuma notificação por aqui.
                </span>
              )}
              {!carregando &&
                notificacoes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => clicarNotificacao(n)}
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start',
                      padding: '0.625rem',
                      borderRadius: '0.625rem',
                      cursor: 'pointer',
                      background: n.lida ? 'transparent' : 'rgba(26,122,255,0.08)',
                      border: '1px solid var(--c-divider)',
                    }}
                  >
                    <span
                      style={{
                        marginTop: '0.375rem',
                        width: '8px',
                        height: '8px',
                        borderRadius: '999px',
                        flexShrink: 0,
                        background: n.lida ? 'transparent' : '#1a7aff',
                        border: n.lida ? '1px solid var(--c-divider)' : 'none',
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', minWidth: 0 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-1)' }}>
                        {n.titulo}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--c-text-3)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {n.corpo}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--c-text-3)' }}>
                        {formatarData(n.criada_em)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
