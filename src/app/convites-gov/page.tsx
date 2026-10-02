'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconCopy, IconMailForward, IconSend, IconX } from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import SeletorLocalidade, { type Localidade } from '@/components/SeletorLocalidade'
import { campoStyle } from '@/components/ItemEditavel'
import { api, type ConviteGov } from '@/lib/api'
import { buscarLocalidade, nomePais } from '@/lib/localidades'

const hojeMais = (dias: number) => {
  const d = new Date(Date.now() + dias * 24 * 3600 * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Situacao = 'ativo' | 'usado' | 'expirado' | 'cancelado'

function situacao(c: ConviteGov): Situacao {
  if (c.usado) return 'usado'
  if (c.cancelado_em) return 'cancelado'
  if (new Date(c.expira_em).getTime() < Date.now()) return 'expirado'
  return 'ativo'
}

const ROTULO_SITUACAO: Record<Situacao, { texto: string; cor: string; fundo: string }> = {
  ativo: { texto: 'Ativo', cor: 'var(--c-success-text)', fundo: 'var(--c-success-soft)' },
  usado: { texto: 'Usado', cor: 'var(--c-text-blue)', fundo: 'var(--c-accent-soft)' },
  expirado: { texto: 'Expirado', cor: 'var(--c-text-3)', fundo: 'var(--c-glass-bg-sm)' },
  cancelado: { texto: 'Cancelado', cor: 'var(--c-danger-text)', fundo: 'var(--c-danger-soft)' },
}

function textoLocal(c: { cidade: string; uf: string | null; pais: string }) {
  return [c.cidade, c.uf, c.pais !== 'BR' ? nomePais(c.pais) : null].filter(Boolean).join(' · ')
}

export default function ConvitesGovPage() {
  const [local, setLocal] = useState<Localidade>({ pais: 'BR', uf: null, cidade: null })
  const [descricao, setDescricao] = useState('')
  const [validade, setValidade] = useState(hojeMais(7))
  const [email, setEmail] = useState('')
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [convites, setConvites] = useState<ConviteGov[]>([])
  const [copiado, setCopiado] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | Situacao>('todos')

  function carregar() {
    api
      .listarConvites()
      .then((r) => setConvites(r.convites))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar convites'))
  }

  useEffect(carregar, [])

  async function copiar(c: ConviteGov) {
    try {
      await navigator.clipboard.writeText(c.link)
      setCopiado(c.token)
      setTimeout(() => setCopiado(null), 2000)
    } catch {
      window.prompt('Copie o link do convite:', c.link)
    }
  }

  async function gerar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso('')
    if (!local.cidade?.trim()) return setErro('Informe a cidade')
    if (local.pais === 'BR' && !local.uf) return setErro('Escolha o estado')
    if (!validade) return setErro('Informe a data de validade')
    setCriando(true)
    try {
      const novo = await api.criarConvite({
        pais: local.pais,
        uf: local.uf,
        cidade: local.cidade.trim(),
        descricao: descricao.trim() || undefined,
        expira_em: validade,
        email: email.trim() || undefined,
      })
      setAviso(novo.aviso ?? (novo.email_enviado ? `Convite gerado e enviado para ${novo.email}.` : 'Convite gerado. Copie o link e envie para a pessoa responsável.'))
      setDescricao('')
      setEmail('')
      setLocal({ pais: local.pais, uf: local.uf, cidade: null })
      setValidade(hojeMais(7))
      carregar()
      copiar(novo)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar convite')
    } finally {
      setCriando(false)
    }
  }

  async function reenviar(c: ConviteGov) {
    setErro('')
    setAviso('')
    try {
      await api.reenviarConviteGov(c.token)
      setAviso(`Convite reenviado para ${c.email}.`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao reenviar')
    }
  }

  async function cancelar(c: ConviteGov) {
    if (!confirm(`Cancelar o convite de ${textoLocal(c)}? O link deixa de funcionar.`)) return
    setErro('')
    try {
      await api.cancelarConviteGov(c.token)
      carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao cancelar')
    }
  }

  const visiveis = useMemo(() => convites.filter((c) => filtro === 'todos' || situacao(c) === filtro), [convites, filtro])

  return (
    <PaginaAdmin
      atual="/convites-gov"
      titulo="Convites Gov"
      descricao="Gere um link de uso único para que um órgão público crie a conta institucional de um local. O link vale até a data escolhida."
    >
      <ErroBanner mensagem={erro} />
      {aviso && (
        <p role="status" style={{ margin: '0 0 1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--c-success-soft)', color: 'var(--c-success-text)', fontSize: '0.875rem', fontWeight: 600 }}>
          {aviso}
        </p>
      )}

      <GlassCard style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={gerar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SeletorLocalidade valor={local} onChange={setLocal} buscar={buscarLocalidade} obrigatorio estiloCampo={{ ...campoStyle, width: '100%' }} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-input-label)' }}>Descrição</span>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Ex.: Secretaria de Turismo — conta para as praias acessíveis"
              style={{ ...campoStyle, width: '100%', resize: 'vertical' }}
            />
            <span style={{ fontSize: '0.8125rem', color: 'var(--c-input-helper)' }}>Aparece para a pessoa convidada e na lista abaixo. {descricao.length}/500</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-input-label)' }}>Validade *</span>
              <input type="date" value={validade} min={hojeMais(1)} max={hojeMais(366)} onChange={(e) => setValidade(e.target.value)} style={{ ...campoStyle, width: '100%' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-input-label)' }}>E-mail (opcional)</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="responsavel@prefeitura.gov.br" style={{ ...campoStyle, width: '100%' }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--c-input-helper)' }}>Se preenchido, o link também vai por e-mail.</span>
            </label>
          </div>
          <div>
            <button type="submit" disabled={criando} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: criando ? 0.6 : 1 }}>
              <IconSend size={16} aria-hidden /> {criando ? 'Gerando…' : 'Gerar convite'}
            </button>
          </div>
        </form>
      </GlassCard>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }} role="group" aria-label="Filtrar convites">
        {(['todos', 'ativo', 'usado', 'expirado', 'cancelado'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            aria-pressed={filtro === f}
            style={{ padding: '0.375rem 0.875rem', borderRadius: '9999px', border: '1px solid var(--c-input-border)', fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', background: filtro === f ? 'var(--c-accent-soft)' : 'transparent', color: filtro === f ? 'var(--c-text-blue)' : 'var(--c-text-2)' }}
          >
            {f === 'todos' ? 'Todos' : ROTULO_SITUACAO[f].texto}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {visiveis.length === 0 && <p style={{ color: 'var(--c-text-3)' }}>Nenhum convite aqui.</p>}
        {visiveis.map((c) => {
          const s = situacao(c)
          const r = ROTULO_SITUACAO[s]
          return (
            <GlassCard key={c.token} style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                  <p style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {textoLocal(c)}
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px', color: r.cor, background: r.fundo }}>{r.texto}</span>
                  </p>
                  {c.descricao && <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--c-text-2)' }}>{c.descricao}</p>}
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
                    {s === 'usado' && c.usado_em ? `Usado em ${new Date(c.usado_em).toLocaleString('pt-BR')}` : `Vale até ${new Date(c.expira_em).toLocaleDateString('pt-BR')}`}
                    {c.email ? ` · ${c.email}` : ''}
                    {c.criado_por ? ` · criado por ${c.criado_por}` : ''}
                  </p>
                </div>
                {s === 'ativo' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => copiar(c)} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>
                      <IconCopy size={16} aria-hidden /> {copiado === c.token ? 'Copiado!' : 'Copiar link'}
                    </button>
                    {c.email && (
                      <button type="button" onClick={() => reenviar(c)} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>
                        <IconMailForward size={16} aria-hidden /> Reenviar
                      </button>
                    )}
                    <button type="button" onClick={() => cancelar(c)} aria-label={`Cancelar convite de ${textoLocal(c)}`} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, cursor: 'pointer', color: 'var(--c-danger-text)' }}>
                      <IconX size={16} aria-hidden /> Cancelar
                    </button>
                  </div>
                )}
              </div>
            </GlassCard>
          )
        })}
      </div>
    </PaginaAdmin>
  )
}
