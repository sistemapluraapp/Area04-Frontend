'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import IconePicker from '@/components/IconePicker'
import EtiquetaChip from '@/components/EtiquetaChip'
import Carregando from '@/components/Carregando'
import { campoStyle } from '@/components/ItemEditavel'
import { api, type Etiqueta, type PaginaEtiquetavel } from '@/lib/api'

const botaoAzul = { ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' } as const
const titulo2 = { fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 0.25rem' } as const
const ajuda = { color: 'var(--c-text-2)', fontSize: '0.875rem', margin: '0 0 1rem' } as const

export default function EtiquetasPage() {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[] | null>(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoIcone, setNovoIcone] = useState<string | null>(null)
  const [novaDescricao, setNovaDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [busca, setBusca] = useState('')
  const [soEtiquetadas, setSoEtiquetadas] = useState(false)
  const [paginas, setPaginas] = useState<PaginaEtiquetavel[] | null>(null)
  const [aplicando, setAplicando] = useState<string | null>(null)

  const carregarEtiquetas = useCallback(() => {
    api
      .listarEtiquetas()
      .then((r) => setEtiquetas(r.etiquetas))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar etiquetas'))
  }, [])

  const carregarPaginas = useCallback((q: string, so: boolean) => {
    setPaginas(null)
    api
      .paginasParaEtiquetar(q, so)
      .then((r) => setPaginas(r.paginas))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao buscar páginas'))
  }, [])

  useEffect(() => {
    carregarEtiquetas()
    carregarPaginas('', false)
  }, [carregarEtiquetas, carregarPaginas])

  async function criar(e: FormEvent) {
    e.preventDefault()
    if (!novoTitulo.trim()) return
    setSalvando(true)
    setErro('')
    setMensagem('')
    try {
      const nova = await api.criarEtiqueta({ titulo: novoTitulo.trim(), icone: novoIcone, descricao: novaDescricao.trim() || null })
      setEtiquetas((lista) => [...(lista ?? []), nova].sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR')))
      setNovoTitulo('')
      setNovoIcone(null)
      setNovaDescricao('')
      setMensagem(`Etiqueta "${nova.titulo}" criada. Agora aplique-a nas páginas abaixo.`)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar etiqueta')
    } finally {
      setSalvando(false)
    }
  }

  async function atualizar(etiqueta: Etiqueta, patch: Partial<Pick<Etiqueta, 'titulo' | 'icone' | 'descricao' | 'ativo'>>) {
    setErro('')
    setEtiquetas((lista) => (lista ?? []).map((x) => (x.id === etiqueta.id ? { ...x, ...patch } : x)))
    try {
      await api.atualizarEtiqueta(etiqueta.id, patch)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
      carregarEtiquetas()
    }
  }

  async function excluir(etiqueta: Etiqueta) {
    const aviso = etiqueta.total_paginas
      ? `Excluir "${etiqueta.titulo}"? Ela sai de ${etiqueta.total_paginas === 1 ? '1 página' : `${etiqueta.total_paginas} páginas`}.`
      : `Excluir "${etiqueta.titulo}"?`
    if (!confirm(aviso)) return
    try {
      await api.excluirEtiqueta(etiqueta.id)
      setEtiquetas((lista) => (lista ?? []).filter((x) => x.id !== etiqueta.id))
      setPaginas((lista) => (lista ?? []).map((p) => (p.etiqueta_id === etiqueta.id ? { ...p, etiqueta_id: null } : p)))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  async function aplicar(pagina: PaginaEtiquetavel, etiquetaId: string | null) {
    setAplicando(pagina.id)
    setErro('')
    setMensagem('')
    try {
      await api.aplicarEtiqueta(pagina.id, etiquetaId)
      setPaginas((lista) => (lista ?? []).map((p) => (p.id === pagina.id ? { ...p, etiqueta_id: etiquetaId } : p)))
      carregarEtiquetas()
      const nome = etiquetas?.find((x) => x.id === etiquetaId)?.titulo
      setMensagem(etiquetaId ? `"${pagina.nome}" agora mostra a etiqueta "${nome}".` : `A etiqueta foi removida de "${pagina.nome}".`)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao aplicar etiqueta')
    } finally {
      setAplicando(null)
    }
  }

  function buscar(e: FormEvent) {
    e.preventDefault()
    carregarPaginas(busca, soEtiquetadas)
  }

  return (
    <PaginaAdmin
      atual="/etiquetas"
      titulo="Etiquetas"
      descricao="Crie etiquetas próprias da Plura (ex.: Oficial, Parceiro, Ilustrativa) com título e ícone e aplique uma delas em cada página. A etiqueta aparece nos cards da busca e no topo da página pública. Os donos das páginas não conseguem alterá-la."
    >
      <ErroBanner mensagem={erro} />
      {mensagem && (
        <p role="status" style={{ margin: '0 0 1rem', padding: '0.625rem 0.875rem', borderRadius: '0.75rem', background: 'var(--c-success-soft, rgba(22,163,74,0.1))', color: 'var(--c-success-text, #15803d)', fontSize: '0.875rem', fontWeight: 600 }}>
          {mensagem}
        </p>
      )}

      <GlassCard style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h2 style={titulo2}>Lista de etiquetas</h2>
        <p style={ajuda}>Título curto (até 40 caracteres) e um ícone. A descrição é só para a equipe do ADM.</p>
        <form onSubmit={criar} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <IconePicker valor={novoIcone} onChange={setNovoIcone} />
          <input value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} maxLength={40} placeholder="Título da etiqueta (ex.: Oficial)" aria-label="Título da nova etiqueta" style={{ ...campoStyle, flex: '1 1 200px' }} />
          <input value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} maxLength={300} placeholder="Descrição interna (opcional)" aria-label="Descrição interna" style={{ ...campoStyle, flex: '2 1 240px' }} />
          <button type="submit" disabled={salvando || !novoTitulo.trim()} style={{ ...botaoAzul, opacity: salvando || !novoTitulo.trim() ? 0.6 : 1 }}>
            <IconPlus size={16} aria-hidden /> Criar etiqueta
          </button>
        </form>

        {etiquetas === null ? (
          <Carregando compacto />
        ) : etiquetas.length === 0 ? (
          <p style={{ color: 'var(--c-text-3)', margin: 0 }}>Nenhuma etiqueta criada ainda.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {etiquetas.map((et) => (
              <li key={et.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', padding: '0.625rem 0.75rem', borderRadius: '0.875rem', border: '1px solid var(--c-divider)', opacity: et.ativo ? 1 : 0.6 }}>
                <IconePicker valor={et.icone} onChange={(icone) => atualizar(et, { icone })} rotulo={`Trocar ícone de ${et.titulo}`} />
                <input
                  defaultValue={et.titulo}
                  maxLength={40}
                  aria-label={`Título da etiqueta ${et.titulo}`}
                  onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== et.titulo && atualizar(et, { titulo: e.target.value.trim() })}
                  style={{ ...campoStyle, flex: '1 1 160px', fontWeight: 600 }}
                />
                <span style={{ flex: '0 0 auto' }} aria-label="Prévia">
                  <EtiquetaChip titulo={et.titulo} icone={et.icone} />
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)', minWidth: '6.5rem' }}>
                  {et.total_paginas === 1 ? '1 página' : `${et.total_paginas} páginas`}
                </span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--c-text-2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={et.ativo} onChange={(e) => atualizar(et, { ativo: e.target.checked })} /> Visível
                </label>
                <button type="button" onClick={() => excluir(et)} aria-label={`Excluir etiqueta ${et.titulo}`} style={{ background: 'none', border: '1px solid var(--c-divider)', borderRadius: '0.625rem', padding: '0.4rem', color: 'var(--c-danger-text, #dc2626)', cursor: 'pointer', display: 'flex' }}>
                  <IconTrash size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard style={{ padding: '1.25rem' }}>
        <h2 style={titulo2}>Aplicar nas páginas</h2>
        <p style={ajuda}>Busque a página e escolha a etiqueta. Cada página mostra no máximo uma.</p>
        <form onSubmit={buscar} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome da página ou cidade" aria-label="Buscar página" style={{ ...campoStyle, flex: '1 1 240px' }} />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--c-text-2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={soEtiquetadas} onChange={(e) => setSoEtiquetadas(e.target.checked)} /> Só com etiqueta
          </label>
          <button type="submit" style={botaoAzul}>
            <IconSearch size={16} aria-hidden /> Buscar
          </button>
        </form>

        {paginas === null ? (
          <Carregando compacto />
        ) : paginas.length === 0 ? (
          <p style={{ color: 'var(--c-text-3)', margin: 0 }}>Nenhuma página encontrada.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  {['Página', 'Tipo', 'Local', 'Etiqueta'].map((t) => (
                    <th key={t} scope="col" style={{ textAlign: 'left', padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--c-divider)', fontWeight: 700 }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginas.map((p) => {
                  const atual = etiquetas?.find((x) => x.id === p.etiqueta_id)
                  return (
                    <tr key={p.id}>
                      <td style={{ padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--c-divider)', fontWeight: 600 }}>
                        {p.nome}
                        {p.suspensa && <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem', color: 'var(--c-text-3)' }}>(suspensa)</span>}
                      </td>
                      <td style={{ padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--c-divider)', color: 'var(--c-text-2)' }}>{p.tipo === 'publica' ? 'Gov' : 'Empresa'}</td>
                      <td style={{ padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--c-divider)', color: 'var(--c-text-2)' }}>{[p.cidade, p.uf].filter(Boolean).join('/') || '—'}</td>
                      <td style={{ padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--c-divider)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <select
                            value={p.etiqueta_id ?? ''}
                            disabled={aplicando === p.id}
                            onChange={(e) => aplicar(p, e.target.value || null)}
                            aria-label={`Etiqueta de ${p.nome}`}
                            style={campoStyle}
                          >
                            <option value="">Sem etiqueta</option>
                            {(etiquetas ?? []).map((et) => (
                              <option key={et.id} value={et.id}>
                                {et.titulo}{et.ativo ? '' : ' (oculta)'}
                              </option>
                            ))}
                          </select>
                          {atual && <EtiquetaChip titulo={atual.titulo} icone={atual.icone} tamanho="pequeno" />}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </PaginaAdmin>
  )
}
