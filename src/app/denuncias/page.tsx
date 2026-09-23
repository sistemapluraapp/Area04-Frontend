'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconCheck, IconFlag, IconX } from '@tabler/icons-react'
import PaginaAdmin, { Abas, ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import { campoStyle } from '@/components/ItemEditavel'
import { api, type Denuncia, type StatusDenuncia } from '@/lib/api'

const ABAS: { id: StatusDenuncia; label: string }[] = [
  { id: 'pendente', label: 'Pendentes' },
  { id: 'resolvida', label: 'Resolvidas' },
  { id: 'descartada', label: 'Descartadas' },
]

const MOTIVO_LABEL: Record<string, string> = {
  recurso_nao_existe: 'Recurso não existe',
  acessibilidade_diferente: 'Acessibilidade diferente da descrita',
  horario_incorreto: 'Horário incorreto',
  local_fechado: 'Local fechado',
  informacao_desatualizada: 'Informação desatualizada',
  outro: 'Outro',
}

const AREA01_URL = process.env.NEXT_PUBLIC_AREA01_URL ?? 'https://area01-frontend.pages.dev'

function CardDenuncia({ d, onAtualizar }: { d: Denuncia; onAtualizar: (status: StatusDenuncia, obs?: string) => Promise<void> }) {
  const [obs, setObs] = useState(d.observacao_admin ?? '')
  const [enviando, setEnviando] = useState(false)

  async function atualizar(status: StatusDenuncia) {
    setEnviando(true)
    try {
      await onAtualizar(status, obs.trim() || undefined)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <GlassCard style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--c-danger-text)' }}>
        <IconFlag size={18} />
        <span style={{ fontWeight: 700 }}>{MOTIVO_LABEL[d.motivo] ?? d.motivo}</span>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)' }}>
        <a href={`${AREA01_URL}/pagina?id=${d.pagina_id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-accent-text)', fontWeight: 600 }}>
          {d.pagina_nome}
        </a>{' '}
        · enviada por {d.usuario_nome ?? 'usuário removido'} em {new Date(d.created_at).toLocaleString('pt-BR')}
      </p>
      {d.comentario && <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{d.comentario}</p>}
      <input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observação interna (opcional)" aria-label="Observação interna" style={{ ...campoStyle, width: '100%' }} />
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {d.status !== 'resolvida' && (
          <button type="button" disabled={enviando} onClick={() => atualizar('resolvida')} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'var(--c-success-soft)', border: '1px solid var(--c-success-text)', color: 'var(--c-success-text)', fontWeight: 700, cursor: 'pointer' }}>
            <IconCheck size={16} /> Marcar como resolvida
          </button>
        )}
        {d.status !== 'descartada' && (
          <button type="button" disabled={enviando} onClick={() => atualizar('descartada')} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontWeight: 600 }}>
            <IconX size={16} /> Descartar
          </button>
        )}
        {d.status !== 'pendente' && (
          <button type="button" disabled={enviando} onClick={() => atualizar('pendente')} style={{ ...campoStyle, cursor: 'pointer' }}>
            Reabrir
          </button>
        )}
      </div>
    </GlassCard>
  )
}

export default function DenunciasPage() {
  const [status, setStatus] = useState<StatusDenuncia>('pendente')
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(() => {
    setCarregando(true)
    setErro('')
    api
      .listarDenuncias(status)
      .then((r) => setDenuncias(r.denuncias))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar denúncias'))
      .finally(() => setCarregando(false))
  }, [status])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function atualizar(d: Denuncia, novo: StatusDenuncia, obs?: string) {
    try {
      await api.atualizarDenuncia(d.id, novo, obs)
      setDenuncias((l) => l.filter((x) => x.id !== d.id))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar denúncia')
    }
  }

  return (
    <PaginaAdmin
      atual="/denuncias"
      titulo="Denúncias de informação"
      descricao='Enviadas pelos usuários no botão "Essa informação está incorreta?" das páginas dos empreendimentos.'
    >
      <Abas abas={ABAS} atual={status} onChange={setStatus} />
      <ErroBanner mensagem={erro} />
      {carregando && <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>}
      {!carregando && denuncias.length === 0 && !erro && <p style={{ color: 'var(--c-text-3)' }}>Nenhuma denúncia aqui.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
        {denuncias.map((d) => (
          <CardDenuncia key={d.id} d={d} onAtualizar={(s, o) => atualizar(d, s, o)} />
        ))}
      </div>
    </PaginaAdmin>
  )
}
