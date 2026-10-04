'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { IconDownload, IconMailForward, IconSend, IconX } from '@tabler/icons-react'
import PaginaAdmin, { Abas, ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import { Switch, campoStyle } from '@/components/ItemEditavel'
import { api, type Administrador, type ConviteAdmin, type FiltrosLog, type LogAdmin, type PermissaoDisponivel } from '@/lib/api'
import { useMeuAcesso } from '@/lib/acesso'
import Carregando from '@/components/Carregando'

type Aba = 'equipe' | 'logs'
const ABAS: { id: Aba; label: string }[] = [
  { id: 'equipe', label: 'Administradores e permissões' },
  { id: 'logs', label: 'Log de atividades' },
]

const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function Aviso({ texto, onFechar }: { texto: string; onFechar: () => void }) {
  return (
    <div role="status" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', margin: '0 0 1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--c-success-soft)', color: 'var(--c-success-text)', fontSize: '0.875rem', fontWeight: 600, wordBreak: 'break-word' }}>
      <span style={{ flex: 1 }}>{texto}</span>
      <button type="button" onClick={onFechar} aria-label="Fechar aviso" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}>
        <IconX size={16} aria-hidden />
      </button>
    </div>
  )
}

function Convidar({ permissoes, onConvidado }: { permissoes: PermissaoDisponivel[]; onConvidado: (c: ConviteAdmin, aviso: string) => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [escolhidas, setEscolhidas] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const r = await api.convidarAdmin({ nome: nome.trim(), email: email.trim(), permissoes: escolhidas })
      onConvidado(r, r.aviso ? `${r.aviso} Envie este link à pessoa: ${r.link_convite}` : `Convite enviado para ${r.email}. O link vale por 7 dias.`)
      setNome('')
      setEmail('')
      setEscolhidas([])
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao convidar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <GlassCard style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.0625rem', fontWeight: 800 }}>Convidar administrador</h2>
      <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--c-text-2)' }}>A pessoa recebe um e-mail com um link para criar a própria senha e entrar no painel.</p>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" aria-label="Nome" maxLength={120} style={campoStyle} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" aria-label="E-mail" type="email" style={campoStyle} />
        </div>
        <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
          <legend style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Funcionalidades que poderá usar</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.25rem' }}>
            {permissoes.map((p) => (
              <label key={p.codigo} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={escolhidas.includes(p.codigo)} onChange={() => setEscolhidas((l) => (l.includes(p.codigo) ? l.filter((x) => x !== p.codigo) : [...l, p.codigo]))} />
                {p.rotulo}
              </label>
            ))}
          </div>
        </fieldset>
        {erro && <p role="alert" style={{ margin: 0, color: 'var(--c-danger-text)', fontSize: '0.875rem' }}>{erro}</p>}
        <button type="submit" disabled={enviando || !nome.trim() || !email.trim() || escolhidas.length === 0} style={{ ...campoStyle, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: enviando || !nome.trim() || !email.trim() || escolhidas.length === 0 ? 0.55 : 1 }}>
          <IconSend size={16} aria-hidden /> {enviando ? 'Enviando…' : 'Enviar convite'}
        </button>
      </form>
    </GlassCard>
  )
}

function Matriz({ admins, permissoes, meuId, onAlterar }: { admins: Administrador[]; permissoes: PermissaoDisponivel[]; meuId: string | undefined; onAlterar: (a: Administrador, patch: { permissoes?: string[]; ativo?: boolean }) => void }) {
  return (
    <GlassCard style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.0625rem', fontWeight: 800 }}>Permissões por administrador</h2>
      <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--c-text-2)' }}>Marque as funcionalidades de cada pessoa. As mudanças valem na hora e ficam registradas no log.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '760px' }}>
          <caption className="sr-only">Matriz de permissões dos administradores</caption>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-divider)' }}>
              <th scope="col" style={{ textAlign: 'left', padding: '0.5rem', position: 'sticky', left: 0, background: 'var(--c-glass-bg)' }}>Administrador</th>
              {permissoes.map((p) => (
                <th key={p.codigo} scope="col" style={{ padding: '0.5rem', fontWeight: 600, fontSize: '0.75rem', color: 'var(--c-text-2)', textAlign: 'center', maxWidth: '120px' }}>
                  {p.rotulo}
                </th>
              ))}
              <th scope="col" style={{ padding: '0.5rem', fontWeight: 600, fontSize: '0.75rem', color: 'var(--c-text-2)', textAlign: 'center' }}>Ativo</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const eu = a.id === meuId
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--c-divider)', opacity: a.ativo ? 1 : 0.55 }}>
                  <th scope="row" style={{ textAlign: 'left', padding: '0.625rem 0.5rem', fontWeight: 600, position: 'sticky', left: 0, background: 'var(--c-glass-bg)' }}>
                    {a.nome || '—'} {eu && <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>(você)</span>}
                    <span style={{ display: 'block', fontWeight: 400, fontSize: '0.75rem', color: 'var(--c-text-3)' }}>{a.email}</span>
                  </th>
                  {permissoes.map((p) => {
                    const marcado = a.permissoes.includes(p.codigo)
                    const travado = eu && p.codigo === 'administradores'
                    return (
                      <td key={p.codigo} style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={marcado}
                          disabled={travado}
                          title={travado ? 'Você não pode remover de si a gestão de administradores' : undefined}
                          aria-label={`${p.rotulo} para ${a.nome || a.email}`}
                          onChange={() => onAlterar(a, { permissoes: marcado ? a.permissoes.filter((x) => x !== p.codigo) : [...a.permissoes, p.codigo] })}
                          style={{ width: '1.125rem', height: '1.125rem', cursor: travado ? 'not-allowed' : 'pointer' }}
                        />
                      </td>
                    )
                  })}
                  <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                    {eu ? <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>sim</span> : <Switch ativo={a.ativo} onChange={() => onAlterar(a, { ativo: !a.ativo })} titulo={a.ativo ? `Desativar ${a.nome}` : `Reativar ${a.nome}`} />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function Convites({ convites, permissoes, onReenviar, onCancelar }: { convites: ConviteAdmin[]; permissoes: PermissaoDisponivel[]; onReenviar: (c: ConviteAdmin) => void; onCancelar: (c: ConviteAdmin) => void }) {
  if (convites.length === 0) return null
  const rotulo = (codigo: string) => permissoes.find((p) => p.codigo === codigo)?.rotulo ?? codigo
  return (
    <GlassCard style={{ padding: '1.25rem' }}>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.0625rem', fontWeight: 800 }}>Convites pendentes</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {convites.map((c) => {
          const expirado = new Date(c.expira_em) < new Date()
          return (
            <li key={c.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--c-divider)' }}>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {c.nome} <span style={{ fontWeight: 400, color: 'var(--c-text-2)' }}>· {c.email}</span>
                </p>
                <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: expirado ? 'var(--c-danger-text)' : 'var(--c-text-3)' }}>
                  {expirado ? 'Expirado' : `Vale até ${dataHora(c.expira_em)}`} · {c.permissoes.map(rotulo).join(', ')}
                </p>
              </div>
              <button type="button" onClick={() => onReenviar(c)} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontWeight: 600 }}>
                <IconMailForward size={16} aria-hidden /> Reenviar
              </button>
              <button type="button" onClick={() => onCancelar(c)} style={{ ...campoStyle, cursor: 'pointer', fontWeight: 600, color: 'var(--c-danger-text)' }}>
                Cancelar
              </button>
            </li>
          )
        })}
      </ul>
    </GlassCard>
  )
}

function Logs({ admins }: { admins: Administrador[] }) {
  const [filtros, setFiltros] = useState<FiltrosLog>({})
  const [logs, setLogs] = useState<LogAdmin[]>([])
  const [temMais, setTemMais] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(
    async (mais = false) => {
      setCarregando(true)
      setErro('')
      try {
        const ultimo = mais ? logs.at(-1)?.id : undefined
        const r = await api.listarLogs({ ...filtros, antes_id: ultimo ? String(ultimo) : undefined })
        setLogs((l) => (mais ? [...l, ...r.logs] : r.logs))
        setTemMais(r.tem_mais)
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao carregar o log')
      } finally {
        setCarregando(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtros],
  )

  useEffect(() => {
    carregar(false)
  }, [carregar])

  async function exportar() {
    try {
      await api.baixarLogsCsv(filtros)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao exportar')
    }
  }

  return (
    <GlassCard style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600 }}>
          De
          <input type="date" value={filtros.de ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, de: e.target.value || undefined }))} style={campoStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600 }}>
          Até
          <input type="date" value={filtros.ate ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, ate: e.target.value || undefined }))} style={campoStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600 }}>
          Administrador
          <select value={filtros.admin ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, admin: e.target.value || undefined }))} style={campoStyle}>
            <option value="">Todos</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome || a.email}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={exportar} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontWeight: 600, marginLeft: 'auto' }}>
          <IconDownload size={16} aria-hidden /> Exportar CSV
        </button>
      </div>
      <ErroBanner mensagem={erro} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '640px' }}>
          <caption className="sr-only">Log de atividades dos administradores</caption>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-divider)', textAlign: 'left' }}>
              <th scope="col" style={{ padding: '0.5rem' }}>Quem</th>
              <th scope="col" style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>Quando</th>
              <th scope="col" style={{ padding: '0.5rem' }}>O que foi feito</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--c-divider)', verticalAlign: 'top' }}>
                <td style={{ padding: '0.5rem', fontWeight: 600 }}>
                  {l.admin_nome || '—'}
                  <span style={{ display: 'block', fontWeight: 400, fontSize: '0.75rem', color: 'var(--c-text-3)' }}>{l.admin_email}</span>
                </td>
                <td style={{ padding: '0.5rem', whiteSpace: 'nowrap', color: 'var(--c-text-2)' }}>{dataHora(l.criado_em)}</td>
                <td style={{ padding: '0.5rem' }}>{l.acao}</td>
              </tr>
            ))}
            {!carregando && logs.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '1rem', color: 'var(--c-text-3)', textAlign: 'center' }}>
                  Nenhuma atividade no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {carregando && <Carregando />}
      {temMais && !carregando && (
        <button type="button" onClick={() => carregar(true)} style={{ ...campoStyle, marginTop: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
          Carregar mais
        </button>
      )}
    </GlassCard>
  )
}

export default function AdministradoresPage() {
  const eu = useMeuAcesso()
  const [aba, setAba] = useState<Aba>('equipe')
  const [admins, setAdmins] = useState<Administrador[]>([])
  const [convites, setConvites] = useState<ConviteAdmin[]>([])
  const [permissoes, setPermissoes] = useState<PermissaoDisponivel[]>([])
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    api
      .listarAdmins()
      .then((r) => {
        setAdmins(r.admins)
        setConvites(r.convites)
        setPermissoes(r.permissoes_disponiveis)
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar administradores'))
  }, [])

  async function alterar(a: Administrador, patch: { permissoes?: string[]; ativo?: boolean }) {
    setErro('')
    setAdmins((l) => l.map((x) => (x.id === a.id ? { ...x, ...patch } : x)))
    try {
      const salvo = await api.atualizarAdmin(a.id, patch)
      setAdmins((l) => l.map((x) => (x.id === salvo.id ? salvo : x)))
    } catch (e) {
      setAdmins((l) => l.map((x) => (x.id === a.id ? a : x)))
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  async function reenviar(c: ConviteAdmin) {
    setErro('')
    try {
      const r = await api.reenviarConviteAdmin(c.id)
      setConvites((l) => l.map((x) => (x.id === r.id ? r : x)))
      setAviso(r.aviso ? `${r.aviso} Envie este link à pessoa: ${r.link_convite}` : `Convite reenviado para ${r.email}.`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao reenviar')
    }
  }

  async function cancelar(c: ConviteAdmin) {
    if (!confirm(`Cancelar o convite de ${c.nome}? O link enviado deixa de funcionar.`)) return
    try {
      await api.cancelarConviteAdmin(c.id)
      setConvites((l) => l.filter((x) => x.id !== c.id))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao cancelar')
    }
  }

  return (
    <PaginaAdmin atual="/administradores" titulo="Administradores e logs" descricao="Convide administradores, defina o que cada um pode fazer no painel e acompanhe o histórico de atividades." largura={1180}>
      <Abas abas={ABAS} atual={aba} onChange={setAba} />
      <ErroBanner mensagem={erro} />
      {aviso && <Aviso texto={aviso} onFechar={() => setAviso('')} />}
      {aba === 'equipe' ? (
        <>
          <Convidar
            permissoes={permissoes}
            onConvidado={(c, texto) => {
              setConvites((l) => [c, ...l.filter((x) => x.email !== c.email)])
              setAviso(texto)
            }}
          />
          <Matriz admins={admins} permissoes={permissoes} meuId={eu?.id} onAlterar={alterar} />
          <Convites convites={convites} permissoes={permissoes} onReenviar={reenviar} onCancelar={cancelar} />
        </>
      ) : (
        <Logs admins={admins} />
      )}
    </PaginaAdmin>
  )
}
