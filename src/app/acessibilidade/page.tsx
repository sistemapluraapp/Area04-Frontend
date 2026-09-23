'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import IconePicker from '@/components/IconePicker'
import ItemEditavel, { ESCOPO_LABEL, Switch, campoStyle, slugify } from '@/components/ItemEditavel'
import { api, type Escopo, type Filtro, type GrupoAcessibilidade } from '@/lib/api'

const botaoPrimario = {
  ...campoStyle,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  background: 'linear-gradient(135deg,#1a7aff,#0062e6)',
  color: '#fff',
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer',
} as const

function NovoRecurso({ grupo, ordem, onCriado }: { grupo: string; ordem: number; onCriado: (f: Filtro) => void }) {
  const [rotulo, setRotulo] = useState('')
  const [icone, setIcone] = useState<string | null>(null)
  const [escopo, setEscopo] = useState<Escopo>('ambos')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function criar(e: FormEvent) {
    e.preventDefault()
    const texto = rotulo.trim()
    if (!texto) return
    setSalvando(true)
    setErro('')
    try {
      const filtro = await api.criarFiltro({ tipo: 'recurso_local', categoria: grupo, codigo: slugify(texto), rotulo: texto, icone, escopo, ordem })
      onCriado(filtro)
      setRotulo('')
      setIcone(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar recurso')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={criar} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
      <IconePicker valor={icone} onChange={setIcone} />
      <input value={rotulo} onChange={(e) => setRotulo(e.target.value)} placeholder="Novo recurso neste grupo" aria-label="Nome do novo recurso" style={{ ...campoStyle, flex: '1 1 200px' }} />
      <select value={escopo} onChange={(e) => setEscopo(e.target.value as Escopo)} aria-label="Onde aparece" style={campoStyle}>
        {(Object.keys(ESCOPO_LABEL) as Escopo[]).map((e) => (
          <option key={e} value={e}>
            {ESCOPO_LABEL[e]}
          </option>
        ))}
      </select>
      <button type="submit" disabled={salvando || !rotulo.trim()} style={{ ...botaoPrimario, opacity: salvando || !rotulo.trim() ? 0.6 : 1 }}>
        <IconPlus size={16} /> Adicionar
      </button>
      {erro && <p style={{ width: '100%', color: 'var(--c-danger-text)', fontSize: '0.8125rem' }}>{erro}</p>}
    </form>
  )
}

export default function AcessibilidadePage() {
  const [grupos, setGrupos] = useState<GrupoAcessibilidade[]>([])
  const [recursos, setRecursos] = useState<Filtro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [novoGrupo, setNovoGrupo] = useState('')
  const [novoGrupoIcone, setNovoGrupoIcone] = useState<string | null>(null)

  const carregar = useCallback(() => {
    setCarregando(true)
    Promise.all([api.listarGrupos(), api.listarFiltros()])
      .then(([g, f]) => {
        setGrupos(g.grupos)
        setRecursos(f.filtros.filter((x) => x.tipo === 'recurso_local'))
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const porGrupo = useMemo(() => {
    const mapa = new Map<string, Filtro[]>()
    for (const r of recursos) {
      if (!mapa.has(r.categoria)) mapa.set(r.categoria, [])
      mapa.get(r.categoria)!.push(r)
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.ordem - b.ordem)
    return mapa
  }, [recursos])

  const semGrupo = recursos.filter((r) => !grupos.some((g) => g.codigo === r.categoria))

  async function atualizarGrupo(grupo: GrupoAcessibilidade, patch: Partial<GrupoAcessibilidade>) {
    setGrupos((l) => l.map((g) => (g.codigo === grupo.codigo ? { ...g, ...patch } : g)))
    try {
      await api.atualizarGrupo(grupo.codigo, patch)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar grupo')
      carregar()
    }
  }

  async function excluirGrupo(grupo: GrupoAcessibilidade) {
    if (!confirm(`Excluir o grupo "${grupo.rotulo}"?`)) return
    try {
      await api.excluirGrupo(grupo.codigo)
      setGrupos((l) => l.filter((g) => g.codigo !== grupo.codigo))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir grupo')
    }
  }

  async function criarGrupo(e: FormEvent) {
    e.preventDefault()
    const rotulo = novoGrupo.trim()
    if (!rotulo) return
    try {
      const grupo = await api.criarGrupo({ codigo: slugify(rotulo), rotulo, icone: novoGrupoIcone, ordem: grupos.length + 1 })
      setGrupos((l) => [...l, { ...grupo, total_recursos: 0 }])
      setNovoGrupo('')
      setNovoGrupoIcone(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar grupo')
    }
  }

  async function atualizarRecurso(recurso: Filtro, patch: Partial<Filtro>) {
    setRecursos((l) => l.map((r) => (r.id === recurso.id ? { ...r, ...patch } : r)))
    try {
      await api.atualizarFiltro(recurso.id, patch)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar recurso')
      carregar()
    }
  }

  async function moverRecurso(lista: Filtro[], indice: number, direcao: -1 | 1) {
    const destino = indice + direcao
    if (destino < 0 || destino >= lista.length) return
    const nova = [...lista]
    ;[nova[indice], nova[destino]] = [nova[destino], nova[indice]]
    const base = Math.min(...lista.map((r) => r.ordem))
    const reordenada = nova.map((r, n) => ({ ...r, ordem: base + n }))
    setRecursos((l) => l.map((r) => reordenada.find((x) => x.id === r.id) ?? r))
    try {
      await api.reordenarFiltros(reordenada.map((r) => ({ id: r.id, ordem: r.ordem })))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao reordenar')
      carregar()
    }
  }

  async function excluirRecurso(recurso: Filtro) {
    if (!confirm(`Excluir o recurso "${recurso.rotulo}"? Ele deixa de aparecer nas páginas que o marcaram.`)) return
    try {
      await api.excluirFiltro(recurso.id)
      setRecursos((l) => l.filter((r) => r.id !== recurso.id))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir recurso')
    }
  }

  function listaRecursos(lista: Filtro[]) {
    return lista.map((r, n) => (
      <ItemEditavel
        key={r.id}
        codigo={r.codigo}
        rotulo={r.rotulo}
        icone={r.icone}
        escopo={r.escopo}
        ativo={r.ativo}
        primeiro={n === 0}
        ultimo={n === lista.length - 1}
        extra={
          <select
            value={r.categoria}
            onChange={(e) => atualizarRecurso(r, { categoria: e.target.value })}
            aria-label="Grupo"
            title="Mover para outro grupo"
            style={campoStyle}
          >
            {!grupos.some((g) => g.codigo === r.categoria) && <option value={r.categoria}>{r.categoria}</option>}
            {grupos.map((g) => (
              <option key={g.codigo} value={g.codigo}>
                {g.rotulo}
              </option>
            ))}
          </select>
        }
        onAtualizar={(patch) => atualizarRecurso(r, patch)}
        onSubir={() => moverRecurso(lista, n, -1)}
        onDescer={() => moverRecurso(lista, n, 1)}
        onExcluir={() => excluirRecurso(r)}
      />
    ))
  }

  return (
    <PaginaAdmin
      atual="/acessibilidade"
      titulo="Acessibilidade"
      descricao="Grupos e recursos que os empreendimentos marcam. O nível de cada grupo exibido na página (ex.: Acessibilidade física 4/5) é calculado pela proporção de recursos do grupo marcados pelo empreendimento."
      largura={1040}
    >
      <ErroBanner mensagem={erro} />

      <GlassCard style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={criarGrupo} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <IconePicker valor={novoGrupoIcone} onChange={setNovoGrupoIcone} rotulo="Ícone do grupo" />
          <input value={novoGrupo} onChange={(e) => setNovoGrupo(e.target.value)} placeholder="Novo grupo (ex.: Acessibilidade auditiva)" aria-label="Nome do novo grupo" style={{ ...campoStyle, flex: '1 1 260px' }} />
          <button type="submit" disabled={!novoGrupo.trim()} style={{ ...botaoPrimario, opacity: novoGrupo.trim() ? 1 : 0.6 }}>
            <IconPlus size={16} /> Criar grupo
          </button>
        </form>
      </GlassCard>

      {carregando && <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {grupos.map((g) => {
          const lista = porGrupo.get(g.codigo) ?? []
          return (
            <GlassCard key={g.codigo} style={{ padding: '1.25rem', opacity: g.ativo ? 1 : 0.7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <IconePicker valor={g.icone} onChange={(icone) => atualizarGrupo(g, { icone })} rotulo="Ícone do grupo" />
                <input
                  defaultValue={g.rotulo}
                  onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== g.rotulo && atualizarGrupo(g, { rotulo: e.target.value.trim() })}
                  aria-label="Nome do grupo"
                  style={{ ...campoStyle, fontWeight: 700, fontSize: '1rem', flex: '1 1 220px' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>{lista.length} recurso(s)</span>
                <Switch ativo={g.ativo} onChange={() => atualizarGrupo(g, { ativo: !g.ativo })} titulo={g.ativo ? 'Desativar grupo' : 'Ativar grupo'} />
                <button
                  type="button"
                  onClick={() => excluirGrupo(g)}
                  title={lista.length ? 'Mova ou exclua os recursos antes de excluir o grupo' : 'Excluir grupo'}
                  aria-label="Excluir grupo"
                  style={{ background: 'none', border: '1px solid var(--c-divider)', borderRadius: '0.5rem', padding: '0.3rem', display: 'inline-flex', cursor: 'pointer', color: 'var(--c-danger-text)' }}
                >
                  <IconTrash size={16} />
                </button>
              </div>
              <input
                defaultValue={g.descricao ?? ''}
                onBlur={(e) => e.target.value !== (g.descricao ?? '') && atualizarGrupo(g, { descricao: e.target.value || null })}
                placeholder="Descrição curta do grupo (opcional)"
                aria-label="Descrição do grupo"
                style={{ ...campoStyle, width: '100%', marginBottom: '0.875rem' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{listaRecursos(lista)}</div>
              <NovoRecurso grupo={g.codigo} ordem={(lista.at(-1)?.ordem ?? 0) + 1} onCriado={(f) => setRecursos((l) => [...l, f])} />
            </GlassCard>
          )
        })}

        {semGrupo.length > 0 && (
          <GlassCard style={{ padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Recursos sem grupo</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-2)', marginBottom: '0.875rem' }}>Escolha um grupo para cada recurso abaixo.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{listaRecursos(semGrupo)}</div>
          </GlassCard>
        )}
      </div>
    </PaginaAdmin>
  )
}
