'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { IconCertificate, IconChevronRight, IconPlus } from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import Icone from '@/components/Icone'
import Carregando from '@/components/Carregando'
import { campoStyle } from '@/components/ItemEditavel'
import { api, type Certificacao } from '@/lib/api'
import { ROTULO_ESCOPO, ROTULO_STATUS, regiao } from '@/lib/certificacoes'

const botaoAzul = { ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' } as const

export default function CertificacoesPage() {
  const router = useRouter()
  const [lista, setLista] = useState<Certificacao[] | null>(null)
  const [erro, setErro] = useState('')
  const [titulo, setTitulo] = useState('')
  const [criando, setCriando] = useState(false)

  const carregar = useCallback(() => {
    api
      .listarCertificacoes()
      .then((r) => setLista(r.certificacoes))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    setCriando(true)
    setErro('')
    try {
      const nova = await api.criarCertificacao({ titulo: titulo.trim() })
      router.push(`/certificacoes/editar?id=${nova.id}`)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar')
      setCriando(false)
    }
  }

  return (
    <PaginaAdmin
      atual="/certificacoes"
      titulo="Certificações"
      descricao="Crie as certificações que empresas e órgãos públicos podem buscar e solicitar. Cada certificação tem etapas (em sequência ou ao mesmo tempo) e, em cada etapa, os requisitos a cumprir. Só as publicadas aparecem para o público."
    >
      <ErroBanner mensagem={erro} />

      <GlassCard style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <form onSubmit={criar} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={120}
            placeholder="Nome da nova certificação (ex.: Selo Turismo Acessível)"
            aria-label="Nome da nova certificação"
            style={{ ...campoStyle, flex: '1 1 260px' }}
          />
          <button type="submit" disabled={criando || !titulo.trim()} style={{ ...botaoAzul, opacity: criando || !titulo.trim() ? 0.6 : 1 }}>
            <IconPlus size={16} aria-hidden /> {criando ? 'Criando…' : 'Criar e editar'}
          </button>
        </form>
      </GlassCard>

      {lista === null ? (
        <Carregando />
      ) : lista.length === 0 ? (
        <p style={{ color: 'var(--c-text-3)' }}>Nenhuma certificação criada ainda.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {lista.map((c) => {
            const st = ROTULO_STATUS[c.status]
            return (
              <li key={c.id}>
                <a
                  href={`/certificacoes/editar?id=${c.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', borderRadius: '1rem', border: 'var(--c-border)', background: 'var(--c-glass-bg)', color: 'inherit', textDecoration: 'none' }}
                >
                  <span aria-hidden style={{ width: '44px', height: '44px', borderRadius: '0.75rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-accent-soft)', color: 'var(--c-accent-text)' }}>
                    {c.icone ? <Icone nome={c.icone} size={22} /> : <IconCertificate size={22} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1rem' }}>{c.titulo}</strong>
                      <span style={{ padding: '0.1rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, color: st.cor, background: st.fundo }}>{st.texto}</span>
                    </span>
                    <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--c-text-2)', marginTop: '0.2rem' }}>
                      {ROTULO_ESCOPO[c.escopo]} · {regiao(c)} · {c.validade_meses ? `válida por ${c.validade_meses} meses` : 'não vence'} ·{' '}
                      {c.total_etapas ?? 0} {c.total_etapas === 1 ? 'etapa' : 'etapas'}, {c.total_requisitos ?? 0} {c.total_requisitos === 1 ? 'requisito' : 'requisitos'}
                    </span>
                  </span>
                  <IconChevronRight size={18} aria-hidden style={{ color: 'var(--c-text-3)', flexShrink: 0 }} />
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </PaginaAdmin>
  )
}
