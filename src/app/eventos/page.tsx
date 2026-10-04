'use client'

import { Fragment, useEffect, useState } from 'react'
import { IconDownload, IconUsers } from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import { campoStyle } from '@/components/ItemEditavel'
import { api, type EventoAdm, type InteressadoAdm, type ResumoEventos } from '@/lib/api'
import Carregando from '@/components/Carregando'

const URL_PUBLICA = 'https://plura.app.br'
const dataCampo = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function baixarCsv(nome: string, linhas: string[][]) {
  const celula = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = '﻿' + linhas.map((l) => l.map(celula).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <GlassCard style={{ padding: '1rem 1.125rem' }}>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>{rotulo}</p>
      <p style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{valor.toLocaleString('pt-BR')}</p>
    </GlassCard>
  )
}

export default function EventosAdmPage() {
  const [de, setDe] = useState(dataCampo(new Date(Date.now() - 30 * 864e5)))
  const [ate, setAte] = useState(dataCampo(new Date(Date.now() + 365 * 864e5)))
  const [busca, setBusca] = useState('')
  const [eventos, setEventos] = useState<EventoAdm[]>([])
  const [resumo, setResumo] = useState<ResumoEventos | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const [interessados, setInteressados] = useState<Record<string, InteressadoAdm[]>>({})
  const [erro, setErro] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .eventosAdm({ de: new Date(`${de}T00:00:00`).toISOString(), ate: new Date(`${ate}T23:59:59`).toISOString(), q: busca.trim() || undefined })
        .then((r) => {
          setEventos(r.eventos)
          setResumo(r.resumo)
          setErro('')
        })
        .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar eventos'))
    }, 300)
    return () => clearTimeout(t)
  }, [de, ate, busca])

  async function alternar(e: EventoAdm) {
    if (aberto === e.id) return setAberto(null)
    setAberto(e.id)
    if (!interessados[e.id]) {
      try {
        const r = await api.interessadosEventoAdm(e.id)
        setInteressados((m) => ({ ...m, [e.id]: r.interessados }))
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Erro ao carregar interessados')
      }
    }
  }

  function exportarEventos() {
    baixarCsv('eventos-plura.csv', [
      ['Evento', 'Página', 'Tipo', 'Início', 'Término', 'Local', 'Cidade', 'Estado', 'Gratuito', 'Publicado', 'Interessados'],
      ...eventos.map((e) => [e.titulo, e.pagina_nome, e.pagina_tipo === 'publica' ? 'Gov' : 'B2B', new Date(e.inicio).toLocaleString('pt-BR'), e.fim ? new Date(e.fim).toLocaleString('pt-BR') : '', e.local_nome ?? '', e.cidade ?? '', e.uf ?? '', e.gratuito == null ? '' : e.gratuito ? 'sim' : 'não', e.publicado ? 'sim' : 'não', String(e.total_interessados)]),
    ])
  }

  function exportarInteressados(e: EventoAdm) {
    baixarCsv(`interessados-${e.id.slice(0, 8)}.csv`, [['Nome', 'Cidade', 'Estado', 'Interesse em'], ...(interessados[e.id] ?? []).map((i) => [i.nome, i.cidade ?? '', i.uf ?? '', new Date(i.criado_em).toLocaleString('pt-BR')])])
  }

  return (
    <PaginaAdmin atual="/eventos" titulo="Eventos e interessados" descricao="Eventos cadastrados pelas páginas B2B e Gov, com o número de pessoas que marcaram “Tenho interesse”." largura={1180}>
      <ErroBanner mensagem={erro} />
      {resumo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Indicador rotulo="Eventos no período" valor={resumo.total_eventos} />
          <Indicador rotulo="Ainda vão acontecer" valor={resumo.proximos} />
          <Indicador rotulo="Interesses marcados" valor={resumo.total_interesses} />
          <Indicador rotulo="Pessoas interessadas" valor={resumo.pessoas_interessadas} />
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600 }}>
          De
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} style={campoStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600 }}>
          Até
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} style={campoStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, flex: '1 1 220px' }}>
          Buscar
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Evento, página ou cidade" style={{ ...campoStyle, width: '100%' }} />
        </label>
        <button type="button" onClick={exportarEventos} disabled={!eventos.length} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>
          <IconDownload size={16} aria-hidden /> Exportar CSV
        </button>
      </div>

      <GlassCard style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--c-text-2)' }}>
              {['Evento', 'Página', 'Data', 'Local', 'Interessados'].map((h) => (
                <th key={h} scope="col" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--c-divider)', fontWeight: 700 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {eventos.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', color: 'var(--c-text-3)' }}>
                  Nenhum evento no período.
                </td>
              </tr>
            )}
            {eventos.map((e) => (
              <Fragment key={e.id}>
                <tr style={{ borderBottom: '1px solid var(--c-divider)', opacity: e.publicado ? 1 : 0.6 }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                    {e.titulo}
                    {!e.publicado && <span style={{ fontWeight: 400, color: 'var(--c-text-3)' }}> (não publicado)</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <a href={`${URL_PUBLICA}/pagina?id=${e.pagina_id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-text-blue)' }}>
                      {e.pagina_nome}
                    </a>
                    <span style={{ color: 'var(--c-text-3)' }}> · {e.pagina_tipo === 'publica' ? 'Gov' : 'B2B'}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{new Date(e.inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{[e.local_nome, [e.cidade, e.uf].filter(Boolean).join('/')].filter(Boolean).join(' · ')}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button type="button" onClick={() => alternar(e)} aria-expanded={aberto === e.id} disabled={e.total_interessados === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--c-divider)', background: e.total_interessados ? 'var(--c-accent-soft)' : 'transparent', color: e.total_interessados ? 'var(--c-text-blue)' : 'var(--c-text-3)', fontWeight: 700, fontFamily: 'inherit', cursor: e.total_interessados ? 'pointer' : 'default' }}>
                      <IconUsers size={15} aria-hidden /> {e.total_interessados}
                    </button>
                  </td>
                </tr>
                {aberto === e.id && (
                  <tr>
                    <td colSpan={5} style={{ padding: '0.75rem 1rem 1rem', background: 'var(--c-glass-bg-sm)' }}>
                      {!interessados[e.id] ? (
                        <Carregando compacto />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <ul style={{ margin: 0, paddingLeft: '1.125rem', columns: '2 260px' }}>
                            {interessados[e.id].map((i, n) => (
                              <li key={n}>
                                {i.nome}
                                {i.cidade ? ` · ${[i.cidade, i.uf].filter(Boolean).join('/')}` : ''} <span style={{ color: 'var(--c-text-3)' }}>({new Date(i.criado_em).toLocaleDateString('pt-BR')})</span>
                              </li>
                            ))}
                          </ul>
                          <button type="button" onClick={() => exportarInteressados(e)} style={{ ...campoStyle, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>
                            <IconDownload size={15} aria-hidden /> Exportar interessados
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </PaginaAdmin>
  )
}
