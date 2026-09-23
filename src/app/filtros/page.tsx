'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminNav, { useRequireAuth } from '@/components/AdminNav'
import GlassCard from '@/components/GlassCard'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { api, type Filtro } from '@/lib/api'

type Tipo = Filtro['tipo']

const ABAS: { tipo: Tipo; label: string }[] = [
  { tipo: 'recurso_local', label: 'Recursos do local' },
  { tipo: 'necessidade_pessoal', label: 'Necessidades pessoais' },
]

function slugify(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function agruparPorCategoria(filtros: Filtro[]) {
  const grupos = new Map<string, Filtro[]>()
  for (const f of filtros) {
    if (!grupos.has(f.categoria)) grupos.set(f.categoria, [])
    grupos.get(f.categoria)!.push(f)
  }
  for (const lista of grupos.values()) lista.sort((a, b) => a.ordem - b.ordem)
  return grupos
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

function Switch({ ativo, onChange }: { ativo: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      title={ativo ? 'Suspender filtro' : 'Reativar filtro'}
      style={{
        width: '2.25rem',
        height: '1.25rem',
        borderRadius: 'var(--radius-full)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        background: ativo ? 'linear-gradient(135deg, #1a7aff 0%, #0062e6 100%)' : 'var(--c-text-4)',
        transition: 'background 150ms ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: ativo ? 'calc(100% - 1.125rem)' : '2px',
          width: '1rem',
          height: '1rem',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 150ms ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  )
}

function FiltroRow({
  filtro,
  isPrimeiro,
  isUltimo,
  onMover,
  onSalvarRotulo,
  onToggleAtivo,
  onExcluir,
}: {
  filtro: Filtro
  isPrimeiro: boolean
  isUltimo: boolean
  onMover: (direcao: -1 | 1) => void
  onSalvarRotulo: (rotulo: string) => void
  onToggleAtivo: () => void
  onExcluir: () => void
}) {
  const [rotulo, setRotulo] = useState(filtro.rotulo)

  useEffect(() => setRotulo(filtro.rotulo), [filtro.rotulo])

  function commit() {
    const valor = rotulo.trim()
    if (valor && valor !== filtro.rotulo) onSalvarRotulo(valor)
    else setRotulo(filtro.rotulo)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.625rem 0.875rem',
        borderRadius: '0.625rem',
        background: filtro.ativo ? 'var(--c-glass-bg-sm)' : 'transparent',
        opacity: filtro.ativo ? 1 : 0.5,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        <button
          type="button"
          disabled={isPrimeiro}
          onClick={() => onMover(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--c-text-3)',
            cursor: isPrimeiro ? 'not-allowed' : 'pointer',
            opacity: isPrimeiro ? 0.3 : 1,
            padding: 0,
            display: 'flex',
          }}
        >
          <ArrowUpIcon />
        </button>
        <button
          type="button"
          disabled={isUltimo}
          onClick={() => onMover(1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--c-text-3)',
            cursor: isUltimo ? 'not-allowed' : 'pointer',
            opacity: isUltimo ? 0.3 : 1,
            padding: 0,
            display: 'flex',
          }}
        >
          <ArrowDownIcon />
        </button>
      </div>

      <input
        value={rotulo}
        onChange={(e) => setRotulo(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') setRotulo(filtro.rotulo)
        }}
        style={{
          flex: 1,
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: '0.5rem',
          padding: '0.375rem 0.5rem',
          color: 'var(--c-text-1)',
          fontSize: '0.9375rem',
          fontFamily: 'inherit',
          outline: 'none',
        }}
        onFocus={(e) => (e.currentTarget.style.border = '1px solid var(--c-input-border)')}
      />

      <span
        style={{
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--c-text-3)',
          whiteSpace: 'nowrap',
        }}
      >
        {filtro.codigo}
      </span>

      <Switch ativo={filtro.ativo} onChange={onToggleAtivo} />

      <button
        type="button"
        onClick={onExcluir}
        title="Excluir permanentemente"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(239,68,68,0.75)',
          cursor: 'pointer',
          padding: '0.25rem',
          display: 'flex',
        }}
      >
        <TrashIcon />
      </button>
    </div>
  )
}

function FormNovoFiltro({
  tipo,
  categoria,
  onCriado,
  onCancelar,
}: {
  tipo: Tipo
  categoria: string
  onCriado: (f: Filtro) => void
  onCancelar: () => void
}) {
  const [rotulo, setRotulo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [codigoEditadoManualmente, setCodigoEditadoManualmente] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function handleRotuloChange(valor: string) {
    setRotulo(valor)
    if (!codigoEditadoManualmente) setCodigo(slugify(valor))
  }

  async function salvar() {
    const codigoFinal = slugify(codigo)
    if (!rotulo.trim() || !codigoFinal) {
      setErro('Preencha rótulo e código')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      const criado = await api.criarFiltro({ tipo, categoria, codigo: codigoFinal, rotulo: rotulo.trim() })
      onCriado(criado)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar filtro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        padding: '0.875rem',
        borderRadius: '0.625rem',
        background: 'rgba(26,122,255,0.06)',
        border: '1px solid rgba(26,122,255,0.20)',
        marginBottom: '0.75rem',
      }}
    >
      <div style={{ flex: '1 1 200px' }}>
        <Input
          label="Rótulo"
          placeholder="Ex.: Rampa de acesso"
          value={rotulo}
          onChange={(e) => handleRotuloChange(e.target.value)}
          autoFocus
        />
      </div>
      <div style={{ flex: '1 1 180px' }}>
        <Input
          label="Código"
          value={codigo}
          onChange={(e) => {
            setCodigoEditadoManualmente(true)
            setCodigo(slugify(e.target.value))
          }}
          helperText="minúsculas, números e underscore"
        />
      </div>
      <Button size="sm" onClick={salvar} loading={salvando}>
        Salvar
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancelar} disabled={salvando}>
        Cancelar
      </Button>
      {erro && <p style={{ width: '100%', color: 'var(--c-danger-text)', fontSize: '0.8125rem' }}>{erro}</p>}
    </div>
  )
}

function GrupoCategoria({
  tipo,
  categoria,
  filtros,
  onFiltrosChange,
}: {
  tipo: Tipo
  categoria: string
  filtros: Filtro[]
  onFiltrosChange: (atualizados: (prev: Filtro[]) => Filtro[]) => void
}) {
  const [adicionando, setAdicionando] = useState(false)

  async function moverFiltro(filtro: Filtro, direcao: -1 | 1) {
    const idx = filtros.findIndex((f) => f.id === filtro.id)
    const vizinho = filtros[idx + direcao]
    if (!vizinho) return
    const ordemFiltro = filtro.ordem
    const ordemVizinho = vizinho.ordem
    onFiltrosChange((prev) =>
      prev.map((f) => {
        if (f.id === filtro.id) return { ...f, ordem: ordemVizinho }
        if (f.id === vizinho.id) return { ...f, ordem: ordemFiltro }
        return f
      })
    )
    try {
      await api.reordenarFiltros([
        { id: filtro.id, ordem: ordemVizinho },
        { id: vizinho.id, ordem: ordemFiltro },
      ])
    } catch {
      // reverte em caso de falha
      onFiltrosChange((prev) =>
        prev.map((f) => {
          if (f.id === filtro.id) return { ...f, ordem: ordemFiltro }
          if (f.id === vizinho.id) return { ...f, ordem: ordemVizinho }
          return f
        })
      )
    }
  }

  async function salvarRotulo(filtro: Filtro, rotulo: string) {
    onFiltrosChange((prev) => prev.map((f) => (f.id === filtro.id ? { ...f, rotulo } : f)))
    try {
      await api.atualizarFiltro(filtro.id, { rotulo })
    } catch {
      onFiltrosChange((prev) => prev.map((f) => (f.id === filtro.id ? { ...f, rotulo: filtro.rotulo } : f)))
    }
  }

  async function toggleAtivo(filtro: Filtro) {
    const novoValor = !filtro.ativo
    onFiltrosChange((prev) => prev.map((f) => (f.id === filtro.id ? { ...f, ativo: novoValor } : f)))
    try {
      await api.atualizarFiltro(filtro.id, { ativo: novoValor })
    } catch {
      onFiltrosChange((prev) => prev.map((f) => (f.id === filtro.id ? { ...f, ativo: !novoValor } : f)))
    }
  }

  async function excluir(filtro: Filtro) {
    if (!window.confirm('Excluir permanentemente este filtro? Isso não pode ser desfeito.')) return
    try {
      await api.excluirFiltro(filtro.id)
      onFiltrosChange((prev) => prev.filter((f) => f.id !== filtro.id))
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erro ao excluir filtro')
    }
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <h3
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--c-text-3)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {categoria}
        </h3>
        {!adicionando && (
          <Button size="sm" variant="ghost" icon={<PlusIcon />} onClick={() => setAdicionando(true)}>
            Adicionar filtro
          </Button>
        )}
      </div>

      {adicionando && (
        <FormNovoFiltro
          tipo={tipo}
          categoria={categoria}
          onCancelar={() => setAdicionando(false)}
          onCriado={(criado) => {
            onFiltrosChange((prev) => [...prev, criado])
            setAdicionando(false)
          }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {filtros.map((f, idx) => (
          <FiltroRow
            key={f.id}
            filtro={f}
            isPrimeiro={idx === 0}
            isUltimo={idx === filtros.length - 1}
            onMover={(direcao) => moverFiltro(f, direcao)}
            onSalvarRotulo={(rotulo) => salvarRotulo(f, rotulo)}
            onToggleAtivo={() => toggleAtivo(f)}
            onExcluir={() => excluir(f)}
          />
        ))}
      </div>
    </div>
  )
}

export default function FiltrosPage() {
  const pronto = useRequireAuth()
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState<Tipo>('recurso_local')

  useEffect(() => {
    if (!pronto) return
    api
      .listarFiltros()
      .then((r) => setFiltros(r.filtros))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar filtros'))
      .finally(() => setCarregando(false))
  }, [pronto])

  const filtrosDaAba = useMemo(() => filtros.filter((f) => f.tipo === aba), [filtros, aba])
  const grupos = useMemo(() => agruparPorCategoria(filtrosDaAba), [filtrosDaAba])
  const categorias = useMemo(() => Array.from(grupos.keys()).sort(), [grupos])

  function atualizarFiltros(fn: (prev: Filtro[]) => Filtro[]) {
    setFiltros(fn)
  }

  if (!pronto) return null

  return (
    <>
      <Grain />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminNav atual="/filtros" />
        <main style={{ flex: 1, maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem 3rem', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Filtros de acessibilidade
          </h1>
          <p style={{ color: 'var(--c-text-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Rótulos e ordem exibidos em todo o produto. Suspender oculta o filtro para novas seleções sem apagar dados
            históricos; excluir é permanente.
          </p>

          {erro && <ErroBanner mensagem={erro} />}

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {ABAS.map((a) => (
              <button
                key={a.tipo}
                onClick={() => setAba(a.tipo)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.625rem',
                  border: aba === a.tipo ? '1px solid rgba(26,122,255,0.45)' : '1px solid var(--c-divider)',
                  background: aba === a.tipo ? 'rgba(26,122,255,0.13)' : 'transparent',
                  color: aba === a.tipo ? 'var(--c-text-1)' : 'var(--c-text-2)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>

          {carregando && <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>}

          {!carregando && (
            <GlassCard style={{ padding: '1.5rem' }}>
              {categorias.length === 0 && (
                <p style={{ color: 'var(--c-text-3)', fontSize: '0.875rem' }}>Nenhum filtro cadastrado nesta categoria ainda.</p>
              )}
              {categorias.map((categoria) => (
                <GrupoCategoria
                  key={categoria}
                  tipo={aba}
                  categoria={categoria}
                  filtros={grupos.get(categoria) ?? []}
                  onFiltrosChange={atualizarFiltros}
                />
              ))}
            </GlassCard>
          )}
        </main>
        <Footer />
      </div>
    </>
  )
}
