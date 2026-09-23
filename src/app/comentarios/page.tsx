'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconCheck, IconSearch, IconStarFilled, IconX } from '@tabler/icons-react'
import PaginaAdmin, { Abas, ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import { campoStyle } from '@/components/ItemEditavel'
import { api, type ComentarioModeracao, type StatusComentario } from '@/lib/api'

type Filtro = StatusComentario | 'todos'

const ABAS: { id: Filtro; label: string }[] = [
  { id: 'pendente', label: 'Aguardando' },
  { id: 'aprovado', label: 'Aprovados' },
  { id: 'reprovado', label: 'Reprovados' },
  { id: 'todos', label: 'Todos' },
]

const STATUS_VISUAL: Record<StatusComentario, { rotulo: string; cor: string; fundo: string }> = {
  pendente: { rotulo: 'Aguardando moderação', cor: 'var(--c-warning-text)', fundo: 'var(--c-warning-soft)' },
  aprovado: { rotulo: 'Aprovado', cor: 'var(--c-success-text)', fundo: 'var(--c-success-soft)' },
  reprovado: { rotulo: 'Reprovado', cor: 'var(--c-danger-text)', fundo: 'var(--c-danger-soft)' },
}

function iniciais(nome: string | null) {
  return (nome ?? '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function CardComentario({ c, onModerar }: { c: ComentarioModeracao; onModerar: (status: StatusComentario, motivo?: string) => Promise<void> }) {
  const [motivo, setMotivo] = useState('')
  const [reprovando, setReprovando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const visual = STATUS_VISUAL[c.status]

  async function moderar(status: StatusComentario, m?: string) {
    setEnviando(true)
    try {
      await onModerar(status, m)
      setReprovando(false)
      setMotivo('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <GlassCard style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          aria-hidden
          style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: c.usuario_avatar_url ? `url("${c.usuario_avatar_url}") center/cover` : 'linear-gradient(135deg,#1a7aff,#0062e6)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem',
          }}
        >
          {!c.usuario_avatar_url && iniciais(c.usuario_nome)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{c.usuario_nome ?? 'Usuário removido'}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>
            em <strong style={{ color: 'var(--c-text-1)' }}>{c.pagina_nome}</strong> · {new Date(c.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '9999px', color: visual.cor, background: visual.fundo, whiteSpace: 'nowrap' }}>
          {visual.rotulo}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.125rem', color: '#f59e0b' }} aria-label={`Nota ${c.nota} de 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <IconStarFilled key={i} size={16} style={{ opacity: i < c.nota ? 1 : 0.2 }} />
        ))}
      </div>

      <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.comentario || <em style={{ color: 'var(--c-text-3)' }}>Sem texto (apenas nota)</em>}</p>

      {c.status === 'reprovado' && c.motivo_moderacao && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>Motivo da reprovação: {c.motivo_moderacao}</p>
      )}

      {reprovando ? (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo da reprovação (opcional, uso interno)" aria-label="Motivo da reprovação" style={{ ...campoStyle, flex: '1 1 240px' }} />
          <button type="button" disabled={enviando} onClick={() => moderar('reprovado', motivo)} style={{ ...campoStyle, background: 'var(--c-danger-soft)', border: '1px solid var(--c-danger-border)', color: 'var(--c-danger-text)', fontWeight: 600, cursor: 'pointer' }}>
            Confirmar reprovação
          </button>
          <button type="button" onClick={() => setReprovando(false)} style={{ ...campoStyle, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {c.status !== 'aprovado' && (
            <button type="button" disabled={enviando} onClick={() => moderar('aprovado')} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'var(--c-success-soft)', border: '1px solid var(--c-success-text)', color: 'var(--c-success-text)', fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={16} /> Aprovar
            </button>
          )}
          {c.status !== 'reprovado' && (
            <button type="button" disabled={enviando} onClick={() => setReprovando(true)} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'var(--c-danger-soft)', border: '1px solid var(--c-danger-border)', color: 'var(--c-danger-text)', fontWeight: 700, cursor: 'pointer' }}>
              <IconX size={16} /> Reprovar
            </button>
          )}
        </div>
      )}
    </GlassCard>
  )
}

export default function ComentariosPage() {
  const [filtro, setFiltro] = useState<Filtro>('pendente')
  const [pessoa, setPessoa] = useState('')
  const [empreendimento, setEmpreendimento] = useState('')
  const [busca, setBusca] = useState({ pessoa: '', empreendimento: '' })
  const [comentarios, setComentarios] = useState<ComentarioModeracao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(() => {
    setCarregando(true)
    setErro('')
    api
      .listarComentarios({ status: filtro === 'todos' ? undefined : filtro, pessoa: busca.pessoa, empreendimento: busca.empreendimento })
      .then((r) => setComentarios(r.comentarios))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar comentários'))
      .finally(() => setCarregando(false))
  }, [filtro, busca])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Busca por texto com pequeno atraso para não consultar a cada tecla
  useEffect(() => {
    const t = setTimeout(() => setBusca({ pessoa: pessoa.trim(), empreendimento: empreendimento.trim() }), 350)
    return () => clearTimeout(t)
  }, [pessoa, empreendimento])

  async function moderar(c: ComentarioModeracao, status: StatusComentario, motivo?: string) {
    try {
      const r = await api.moderarComentario(c.id, status, motivo)
      setComentarios((l) =>
        filtro === 'todos' ? l.map((x) => (x.id === c.id ? { ...x, ...r } : x)) : l.filter((x) => x.id !== c.id)
      )
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao moderar comentário')
    }
  }

  return (
    <PaginaAdmin
      atual="/comentarios"
      titulo="Comentários"
      descricao="Todo comentário enviado nas páginas dos empreendimentos passa por aqui antes de ser publicado. Aprove para exibir na página ou reprove para mantê-lo oculto."
    >
      <Abas abas={ABAS} atual={filtro} onChange={setFiltro} />

      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          { valor: pessoa, set: setPessoa, placeholder: 'Filtrar por nome da pessoa' },
          { valor: empreendimento, set: setEmpreendimento, placeholder: 'Filtrar por empreendimento' },
        ].map((f) => (
          <div key={f.placeholder} style={{ position: 'relative', flex: '1 1 240px' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', display: 'flex' }}>
              <IconSearch size={16} />
            </span>
            <input value={f.valor} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} aria-label={f.placeholder} style={{ ...campoStyle, width: '100%', paddingLeft: '2.25rem' }} />
          </div>
        ))}
      </div>

      <ErroBanner mensagem={erro} />
      {carregando && <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>}
      {!carregando && comentarios.length === 0 && !erro && <p style={{ color: 'var(--c-text-3)' }}>Nenhum comentário encontrado.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
        {comentarios.map((c) => (
          <CardComentario key={c.id} c={c} onModerar={(status, motivo) => moderar(c, status, motivo)} />
        ))}
      </div>
    </PaginaAdmin>
  )
}
