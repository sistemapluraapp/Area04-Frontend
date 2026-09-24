'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AdminNav, { useRequireAuth } from '@/components/AdminNav'
import GlassCard from '@/components/GlassCard'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import { TrashIcon } from '@/components/icons'
import { UFS } from '@/lib/uf'
import {
  api,
  type Usuario,
  type GovConta,
  type Pagina,
  type EstatisticasPorAno,
  type LoginsPorDia,
} from '@/lib/api'

type Aba = 'usuarios' | 'gov' | 'paginas'

const ABAS: { id: Aba; label: string }[] = [
  { id: 'usuarios', label: 'Usuários' },
  { id: 'gov', label: 'Contas Gov' },
  { id: 'paginas', label: 'Páginas' },
]

const CHART_BLUE = '#3d94ff'
const CHART_AMBER = '#f0b429'
const CHART_GRID = 'var(--c-chart-grid)'
const CHART_TICK = 'var(--c-chart-tick)'
const CHART_TOOLTIP_BG = 'var(--c-chart-tooltip-bg)'
const CHART_TOOLTIP_BORDER = 'var(--c-chart-tooltip-border)'

const MESES_PT_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_PT_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function tooltipStyle() {
  return {
    contentStyle: {
      background: CHART_TOOLTIP_BG,
      border: `1px solid ${CHART_TOOLTIP_BORDER}`,
      borderRadius: '0.625rem',
      fontSize: '0.8125rem',
      fontFamily: 'var(--font-sans)',
      color: 'var(--c-text-1)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    },
    labelStyle: { color: 'var(--c-text-2)', marginBottom: '0.25rem' },
    cursor: { fill: 'var(--c-chart-cursor)' },
  }
}

function ErroBanner({ mensagem }: { mensagem: string }) {
  return (
    <div
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

function StatusBadge({ suspenso }: { suspenso?: boolean }) {
  const ativo = !suspenso
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.1875rem 0.625rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: ativo ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        border: `1px solid ${ativo ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
        color: ativo ? 'var(--c-success-text)' : 'var(--c-danger-text)',
      }}
    >
      {ativo ? 'Ativo' : 'Suspenso'}
    </span>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.625rem 0.875rem',
  fontSize: '0.75rem',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--c-text-3)',
  borderBottom: '1px solid var(--c-divider)',
  whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  padding: '0.75rem 0.875rem',
  fontSize: '0.875rem',
  borderBottom: '1px solid var(--c-divider)',
  verticalAlign: 'middle',
}

function UfCell({ uf, onSalvar }: { uf?: string | null; onSalvar: (uf: string) => Promise<void> }) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState('')
  const [salvando, setSalvando] = useState(false)

  if (uf) return <span>{uf}</span>

  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        style={{
          background: 'none',
          border: '1px dashed var(--c-divider)',
          borderRadius: '0.375rem',
          padding: '0.125rem 0.5rem',
          fontSize: '0.8125rem',
          color: 'var(--c-text-3)',
          cursor: 'pointer',
        }}
      >
        definir UF
      </button>
    )
  }

  return (
    <select
      autoFocus
      disabled={salvando}
      value={valor}
      onChange={async (e) => {
        const novoUf = e.target.value
        setValor(novoUf)
        if (!novoUf) return
        setSalvando(true)
        try {
          await onSalvar(novoUf)
        } finally {
          setSalvando(false)
          setEditando(false)
        }
      }}
      onBlur={() => setEditando(false)}
      style={{
        background: 'var(--c-input-bg)',
        border: '1px solid var(--c-input-border)',
        borderRadius: '0.375rem',
        color: 'var(--c-input-text)',
        fontSize: '0.8125rem',
        padding: '0.125rem 0.375rem',
      }}
    >
      <option value="">--</option>
      {UFS.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
    </select>
  )
}

function Filtros({
  nome,
  setNome,
  uf,
  setUf,
  onBuscar,
}: {
  nome: string
  setNome: (v: string) => void
  uf: string
  setUf: (v: string) => void
  onBuscar: () => void
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onBuscar()
      }}
      style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.25rem' }}
    >
      <div style={{ flex: '1 1 220px' }}>
        <Input placeholder="Buscar por nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div style={{ width: '140px' }}>
        <select
          value={uf}
          onChange={(e) => setUf(e.target.value)}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            background: 'var(--c-input-bg)',
            border: '1px solid var(--c-input-border)',
            borderRadius: '0.75rem',
            color: 'var(--c-input-text)',
            fontSize: '0.9375rem',
          }}
        >
          <option value="">Todas UFs</option>
          {UFS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="secondary" size="md">
        Buscar
      </Button>
    </form>
  )
}

function GraficoAno({ dados }: { dados: EstatisticasPorAno }) {
  const tt = tooltipStyle()
  const linhas = dados.meses.map((mes, i) => ({
    mes: MESES_PT_ABREV[Number(mes) - 1] ?? mes,
    usuarios: dados.usuarios_por_mes[i],
    empresas: dados.empresas_por_mes[i],
    gov: dados.gov_por_mes[i],
  }))
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={linhas} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey="mes" tick={{ fill: CHART_TICK, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: CHART_TICK, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} width={36} />
          <Tooltip {...tt} />
          <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--c-text-2)', paddingTop: '0.5rem' }} iconType="circle" iconSize={8} />
          <Bar dataKey="usuarios" name="Usuários" fill={CHART_BLUE} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="empresas" name="Empresas" fill={CHART_AMBER} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="gov" name="Gov" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function GraficoLogins({ dados }: { dados: LoginsPorDia }) {
  const tt = tooltipStyle()
  const linhas = dados.dias.map((dia, i) => ({
    dia,
    logins_pessoa_empresa: dados.logins_pessoa_empresa_por_dia[i],
    logins_gov: dados.logins_gov_por_dia[i],
  }))
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={linhas} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey="dia" tick={{ fill: CHART_TICK, fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: CHART_TICK, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} width={36} />
          <Tooltip {...tt} />
          <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--c-text-2)', paddingTop: '0.5rem' }} iconType="circle" iconSize={8} />
          <Bar dataKey="logins_pessoa_empresa" name="Pessoa/Empresa" fill={CHART_BLUE} radius={[4, 4, 0, 0]} maxBarSize={16} />
          <Bar dataKey="logins_gov" name="Gov" fill={CHART_AMBER} radius={[4, 4, 0, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function ContasPage() {
  const pronto = useRequireAuth()
  const [aba, setAba] = useState<Aba>('usuarios')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [contasGov, setContasGov] = useState<GovConta[]>([])
  const [paginas, setPaginas] = useState<Pagina[]>([])
  const [erro, setErro] = useState('')
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [suspendendo, setSuspendendo] = useState<string | null>(null)

  const [nomeUsuarios, setNomeUsuarios] = useState('')
  const [ufUsuarios, setUfUsuarios] = useState('')
  const [nomeGov, setNomeGov] = useState('')
  const [ufGov, setUfGov] = useState('')
  const [nomePaginas, setNomePaginas] = useState('')
  const [ufPaginas, setUfPaginas] = useState('')

  const anoAtual = useMemo(() => new Date().getFullYear(), [])
  const anos = useMemo(() => Array.from({ length: 5 }, (_, i) => anoAtual - i), [anoAtual])
  const [anoEscolhido, setAnoEscolhido] = useState(anoAtual)
  const [estatAno, setEstatAno] = useState<EstatisticasPorAno | null>(null)
  const [erroEstatAno, setErroEstatAno] = useState('')

  const [anoLogins, setAnoLogins] = useState(anoAtual)
  const [mesLogins, setMesLogins] = useState(new Date().getMonth() + 1)
  const [loginsPorDia, setLoginsPorDia] = useState<LoginsPorDia | null>(null)
  const [erroLogins, setErroLogins] = useState('')

  function carregarUsuarios() {
    api
      .listarUsuarios({ nome: nomeUsuarios || undefined, uf: ufUsuarios || undefined })
      .then((r) => setUsuarios(r.usuarios))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar usuários'))
  }

  function carregarGov() {
    api
      .listarGovContas({ nome: nomeGov || undefined, uf: ufGov || undefined })
      .then((r) => setContasGov(r.contas))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar contas gov'))
  }

  function carregarPaginas() {
    api
      .listarPaginas({ nome: nomePaginas || undefined, uf: ufPaginas || undefined })
      .then((r) => setPaginas(r.paginas))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar páginas'))
  }

  useEffect(() => {
    if (!pronto) return
    setErro('')
    carregarUsuarios()
    carregarGov()
    carregarPaginas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto])

  useEffect(() => {
    if (!pronto) return
    api
      .estatisticasPorAno(anoEscolhido)
      .then(setEstatAno)
      .catch((e) => setErroEstatAno(e instanceof Error ? e.message : 'Erro ao carregar estatísticas'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, anoEscolhido])

  useEffect(() => {
    if (!pronto) return
    api
      .estatisticasLoginsPorDia(anoLogins, mesLogins)
      .then(setLoginsPorDia)
      .catch((e) => setErroLogins(e instanceof Error ? e.message : 'Erro ao carregar logins'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, anoLogins, mesLogins])

  async function excluir(id: string) {
    if (!confirm('Excluir esta conta permanentemente? Essa ação não pode ser desfeita.')) return
    setExcluindo(id)
    try {
      await api.excluirConta(id)
      carregarUsuarios()
      carregarGov()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir conta')
    } finally {
      setExcluindo(null)
    }
  }

  async function suspenderUsuario(id: string) {
    setSuspendendo(id)
    try {
      await api.suspenderUsuario(id)
      carregarUsuarios()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao suspender usuário')
    } finally {
      setSuspendendo(null)
    }
  }

  async function suspenderGov(id: string) {
    setSuspendendo(id)
    try {
      await api.suspenderGov(id)
      carregarGov()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao suspender conta gov')
    } finally {
      setSuspendendo(null)
    }
  }

  async function suspenderPagina(id: string) {
    setSuspendendo(id)
    try {
      await api.suspenderPagina(id)
      carregarPaginas()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao suspender página')
    } finally {
      setSuspendendo(null)
    }
  }

  if (!pronto) return null

  return (
    <>
      <Grain />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminNav atual="/contas" />
        <main id="conteudo" tabIndex={-1} style={{ flex: 1, maxWidth: '1080px', margin: '0 auto', padding: '0 1.5rem 3rem', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>Contas</h1>

          {erro && <ErroBanner mensagem={erro} />}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <GlassCard style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Contas por ano</h2>
                <select
                  value={anoEscolhido}
                  onChange={(e) => setAnoEscolhido(Number(e.target.value))}
                  style={{
                    background: 'var(--c-input-bg)',
                    border: '1px solid var(--c-input-border)',
                    borderRadius: '0.5rem',
                    color: 'var(--c-input-text)',
                    fontSize: '0.8125rem',
                    padding: '0.25rem 0.625rem',
                  }}
                >
                  {anos.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              {erroEstatAno && <ErroBanner mensagem={erroEstatAno} />}
              {!estatAno && !erroEstatAno && <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>}
              {estatAno && <GraficoAno dados={estatAno} />}
            </GlassCard>

            <GlassCard style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Logins por dia</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={mesLogins}
                    onChange={(e) => setMesLogins(Number(e.target.value))}
                    style={{
                      background: 'var(--c-input-bg)',
                      border: '1px solid var(--c-input-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--c-input-text)',
                      fontSize: '0.8125rem',
                      padding: '0.25rem 0.625rem',
                    }}
                  >
                    {MESES_PT_NOMES.map((nome, i) => (
                      <option key={nome} value={i + 1}>
                        {nome}
                      </option>
                    ))}
                  </select>
                  <select
                    value={anoLogins}
                    onChange={(e) => setAnoLogins(Number(e.target.value))}
                    style={{
                      background: 'var(--c-input-bg)',
                      border: '1px solid var(--c-input-border)',
                      borderRadius: '0.5rem',
                      color: 'var(--c-input-text)',
                      fontSize: '0.8125rem',
                      padding: '0.25rem 0.625rem',
                    }}
                  >
                    {anos.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {erroLogins && <ErroBanner mensagem={erroLogins} />}
              {!loginsPorDia && !erroLogins && <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>}
              {loginsPorDia && <GraficoLogins dados={loginsPorDia} />}
            </GlassCard>
          </div>

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

          {aba === 'usuarios' && (
            <GlassCard style={{ padding: '1.5rem' }}>
              <Filtros nome={nomeUsuarios} setNome={setNomeUsuarios} uf={ufUsuarios} setUf={setUfUsuarios} onBuscar={carregarUsuarios} />
              {usuarios.length === 0 && <p style={{ color: 'var(--c-text-3)' }}>Nenhum usuário encontrado.</p>}
              {usuarios.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={th}>Nome</th>
                        <th style={th}>Email</th>
                        <th style={th}>UF</th>
                        <th style={th}>Status</th>
                        <th style={{ ...th, textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((u) => (
                        <tr key={u.id}>
                          <td style={{ ...td, fontWeight: 600 }}>{u.nome}</td>
                          <td style={{ ...td, color: 'var(--c-text-2)' }}>{u.email ?? '—'}</td>
                          <td style={td}>
                            <UfCell uf={u.uf} onSalvar={async (uf) => { await api.atualizarUfUsuario(u.id, uf); carregarUsuarios() }} />
                          </td>
                          <td style={td}>
                            <StatusBadge suspenso={u.suspenso} />
                          </td>
                          <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                              <Button
                                variant="secondary"
                                size="sm"
                                loading={suspendendo === u.id}
                                onClick={() => suspenderUsuario(u.id)}
                              >
                                {u.suspenso ? 'Reativar' : 'Suspender'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<TrashIcon />}
                                loading={excluindo === u.id}
                                onClick={() => excluir(u.id)}
                                title="Excluir permanentemente"
                                style={{ color: 'var(--c-danger-text)', padding: '0.375rem 0.5rem' }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          )}

          {aba === 'gov' && (
            <GlassCard style={{ padding: '1.5rem' }}>
              <Filtros nome={nomeGov} setNome={setNomeGov} uf={ufGov} setUf={setUfGov} onBuscar={carregarGov} />
              {contasGov.length === 0 && <p style={{ color: 'var(--c-text-3)' }}>Nenhuma conta gov encontrada.</p>}
              {contasGov.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={th}>Nome</th>
                        <th style={th}>Email</th>
                        <th style={th}>Órgão</th>
                        <th style={th}>UF</th>
                        <th style={th}>Status</th>
                        <th style={{ ...th, textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contasGov.map((c) => (
                        <tr key={c.id}>
                          <td style={{ ...td, fontWeight: 600 }}>{c.nome}</td>
                          <td style={{ ...td, color: 'var(--c-text-2)' }}>{c.email ?? '—'}</td>
                          <td style={{ ...td, color: 'var(--c-text-2)' }}>{c.orgao}</td>
                          <td style={td}>
                            <UfCell uf={c.uf} onSalvar={async (uf) => { await api.atualizarUfGov(c.id, uf); carregarGov() }} />
                          </td>
                          <td style={td}>
                            <StatusBadge suspenso={c.suspenso} />
                          </td>
                          <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                              <Button
                                variant="secondary"
                                size="sm"
                                loading={suspendendo === c.id}
                                onClick={() => suspenderGov(c.id)}
                              >
                                {c.suspenso ? 'Reativar' : 'Suspender'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<TrashIcon />}
                                loading={excluindo === c.id}
                                onClick={() => excluir(c.id)}
                                title="Excluir permanentemente"
                                style={{ color: 'var(--c-danger-text)', padding: '0.375rem 0.5rem' }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          )}

          {aba === 'paginas' && (
            <GlassCard style={{ padding: '1.5rem' }}>
              <Filtros nome={nomePaginas} setNome={setNomePaginas} uf={ufPaginas} setUf={setUfPaginas} onBuscar={carregarPaginas} />
              {paginas.length === 0 && <p style={{ color: 'var(--c-text-3)' }}>Nenhuma página encontrada.</p>}
              {paginas.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={th}>Nome</th>
                        <th style={th}>Cidade/UF</th>
                        <th style={th}>Status</th>
                        <th style={{ ...th, textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginas.map((p) => (
                        <tr key={p.id}>
                          <td style={{ ...td, fontWeight: 600 }}>{p.nome}</td>
                          <td style={{ ...td, color: 'var(--c-text-2)' }}>
                            {p.cidade ? `${p.cidade}${p.uf ? '/' + p.uf : ''}` : '—'}
                          </td>
                          <td style={td}>
                            <StatusBadge suspenso={p.suspensa} />
                          </td>
                          <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              loading={suspendendo === p.id}
                              onClick={() => suspenderPagina(p.id)}
                            >
                              {p.suspensa ? 'Reativar' : 'Suspender'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          )}
        </main>
        <Footer />
      </div>
    </>
  )
}
