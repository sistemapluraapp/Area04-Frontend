'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { IconPlus } from '@tabler/icons-react'
import PaginaAdmin, { Abas, ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import IconePicker from '@/components/IconePicker'
import ItemEditavel, { ESCOPO_LABEL, campoStyle, slugify } from '@/components/ItemEditavel'
import { api, type Escopo, type ItemCatalogo, type TipoCatalogo } from '@/lib/api'

const ABAS: { id: TipoCatalogo; label: string; ajuda: string }[] = [
  { id: 'categoria', label: 'Categorias', ajuda: 'Categoria principal do empreendimento (aparece como chip na página e filtra a busca).' },
  { id: 'tag', label: 'Tags', ajuda: 'Etiquetas que o empreendimento pode escolher (ex.: Gastronomia regional, Família).' },
  { id: 'preferencia_turismo', label: 'Preferências de turismo', ajuda: 'Opções que o usuário marca no cadastro e no perfil (ex.: Trilha, Praias).' },
  { id: 'antes_de_ir', label: 'Antes de ir', ajuda: 'Itens do checklist "Antes de ir" exibido na página do empreendimento.' },
]

// Preferências de turismo são do usuário: não dependem de B2B/B2G
const TIPOS_COM_ESCOPO: TipoCatalogo[] = ['categoria', 'tag', 'antes_de_ir']

export default function CatalogoPage() {
  const [tipo, setTipo] = useState<TipoCatalogo>('categoria')
  const [itens, setItens] = useState<ItemCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [novoRotulo, setNovoRotulo] = useState('')
  const [novoIcone, setNovoIcone] = useState<string | null>(null)
  const [novoEscopo, setNovoEscopo] = useState<Escopo>('ambos')
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(() => {
    setCarregando(true)
    setErro('')
    api
      .listarCatalogo(tipo)
      .then((r) => setItens(r.itens))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
      .finally(() => setCarregando(false))
  }, [tipo])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function atualizar(item: ItemCatalogo, patch: Partial<ItemCatalogo>) {
    setItens((lista) => lista.map((i) => (i.id === item.id ? { ...i, ...patch } : i)))
    try {
      await api.atualizarItemCatalogo(item.id, patch)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
      carregar()
    }
  }

  async function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao
    if (destino < 0 || destino >= itens.length) return
    const lista = [...itens]
    ;[lista[indice], lista[destino]] = [lista[destino], lista[indice]]
    const reordenada = lista.map((i, n) => ({ ...i, ordem: n + 1 }))
    setItens(reordenada)
    try {
      await api.reordenarCatalogo(reordenada.map((i) => ({ id: i.id, ordem: i.ordem })))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao reordenar')
      carregar()
    }
  }

  async function excluir(item: ItemCatalogo) {
    if (!confirm(`Excluir "${item.rotulo}"? Empreendimentos que já usam este item deixarão de exibi-lo.`)) return
    try {
      await api.excluirItemCatalogo(item.id)
      setItens((lista) => lista.filter((i) => i.id !== item.id))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  async function criar(e: FormEvent) {
    e.preventDefault()
    const rotulo = novoRotulo.trim()
    if (!rotulo) return
    setSalvando(true)
    setErro('')
    try {
      const item = await api.criarItemCatalogo({
        tipo,
        codigo: slugify(rotulo),
        rotulo,
        icone: novoIcone,
        escopo: TIPOS_COM_ESCOPO.includes(tipo) ? novoEscopo : 'ambos',
        ordem: itens.length + 1,
      })
      setItens((lista) => [...lista, item])
      setNovoRotulo('')
      setNovoIcone(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar')
    } finally {
      setSalvando(false)
    }
  }

  const aba = ABAS.find((a) => a.id === tipo)!
  const comEscopo = TIPOS_COM_ESCOPO.includes(tipo)

  return (
    <PaginaAdmin
      atual="/catalogo"
      titulo="Catálogo"
      descricao="Listas usadas pelos empreendimentos e pelos usuários. Defina ícone, ordem e onde cada item aparece: B2B (empresas, Área 02), B2G (governo, Área 03) ou ambos."
    >
      <Abas abas={ABAS} atual={tipo} onChange={setTipo} />
      <p style={{ color: 'var(--c-text-2)', fontSize: '0.875rem', marginBottom: '1rem' }}>{aba.ajuda}</p>
      <ErroBanner mensagem={erro} />

      <GlassCard style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <form onSubmit={criar} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <IconePicker valor={novoIcone} onChange={setNovoIcone} />
          <input
            value={novoRotulo}
            onChange={(e) => setNovoRotulo(e.target.value)}
            placeholder={`Novo item em "${aba.label}"`}
            aria-label="Nome do novo item"
            style={{ ...campoStyle, flex: '1 1 220px' }}
          />
          {comEscopo && (
            <select value={novoEscopo} onChange={(e) => setNovoEscopo(e.target.value as Escopo)} aria-label="Onde aparece" style={campoStyle}>
              {(Object.keys(ESCOPO_LABEL) as Escopo[]).map((e) => (
                <option key={e} value={e}>
                  {ESCOPO_LABEL[e]}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={salvando || !novoRotulo.trim()}
            style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', opacity: salvando || !novoRotulo.trim() ? 0.6 : 1 }}
          >
            <IconPlus size={16} aria-hidden /> Adicionar
          </button>
        </form>
      </GlassCard>

      {carregando ? (
        <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>
      ) : itens.length === 0 ? (
        <p style={{ color: 'var(--c-text-3)' }}>Nenhum item cadastrado.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {itens.map((item, n) => (
            <ItemEditavel
              key={item.id}
              codigo={item.codigo}
              rotulo={item.rotulo}
              icone={item.icone}
              escopo={comEscopo ? item.escopo : undefined}
              ativo={item.ativo}
              primeiro={n === 0}
              ultimo={n === itens.length - 1}
              onAtualizar={(patch) => atualizar(item, patch)}
              onSubir={() => mover(n, -1)}
              onDescer={() => mover(n, 1)}
              onExcluir={() => excluir(item)}
            />
          ))}
        </div>
      )}
    </PaginaAdmin>
  )
}
