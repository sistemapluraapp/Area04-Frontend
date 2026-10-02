'use client'

import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import { carregarCidades, carregarEstados, listarPaises, type BuscarBackend, type Estado } from '@/lib/localidades'

export interface Localidade {
  pais: string
  uf: string | null
  cidade: string | null
}

const estiloPadrao: CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  background: 'var(--c-input-bg)',
  border: '1px solid var(--c-input-border)',
  borderRadius: '0.75rem',
  color: 'var(--c-input-text)',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
  outline: 'none',
}

function Rotulo({ texto, children, ajuda }: { texto: string; children: React.ReactNode; ajuda?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', minWidth: 0 }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-input-label)' }}>{texto}</span>
      {children}
      {ajuda && <span style={{ fontSize: '0.8125rem', color: 'var(--c-input-helper)', lineHeight: 1.45 }}>{ajuda}</span>}
    </label>
  )
}

// País → Estado → Cidade. O Brasil usa o IBGE; os demais países usam a
// lista do backend e, se ela não estiver disponível, aceitam texto livre.
// A cidade sempre aceita digitação (com sugestões), para não travar o
// preenchimento automático pelo CEP.
export default function SeletorLocalidade({
  valor,
  onChange,
  buscar,
  obrigatorio,
  estiloCampo = estiloPadrao,
}: {
  valor: Localidade
  onChange: (novo: Localidade) => void
  buscar: BuscarBackend
  obrigatorio?: boolean
  estiloCampo?: CSSProperties
}) {
  const idLista = useId()
  const pais = valor.pais || 'BR'
  const paises = useMemo(() => listarPaises(), [])
  const [estados, setEstados] = useState<Estado[] | null>(null)
  const [estadosFalharam, setEstadosFalharam] = useState(false)
  const [cidades, setCidades] = useState<string[]>([])

  useEffect(() => {
    let ativo = true
    setEstados(null)
    setEstadosFalharam(false)
    carregarEstados(pais, buscar)
      .then((lista) => ativo && (lista.length ? setEstados(lista) : setEstadosFalharam(true)))
      .catch(() => ativo && setEstadosFalharam(true))
    return () => {
      ativo = false
    }
  }, [pais, buscar])

  // No Brasil uf é a sigla; nos demais países, o nome do estado
  const estadoAtual = estados?.find((e) => (pais === 'BR' ? e.codigo === valor.uf : e.nome === valor.uf)) ?? null

  useEffect(() => {
    let ativo = true
    setCidades([])
    if (!estadoAtual) return
    carregarCidades(pais, estadoAtual.codigo, buscar)
      .then((lista) => ativo && setCidades(lista))
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [pais, estadoAtual, buscar])

  const marca = obrigatorio ? ' *' : ''
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
      <Rotulo texto={`País${marca}`}>
        <select value={pais} onChange={(e) => onChange({ pais: e.target.value, uf: null, cidade: null })} style={estiloCampo}>
          {paises.map((p) => (
            <option key={p.codigo} value={p.codigo}>
              {p.nome}
            </option>
          ))}
        </select>
      </Rotulo>

      <Rotulo texto={`${pais === 'BR' ? 'Estado (UF)' : 'Estado / província'}${marca}`}>
        {estados && !estadosFalharam ? (
          <select
            value={estadoAtual ? (pais === 'BR' ? estadoAtual.codigo : estadoAtual.nome) : ''}
            onChange={(e) => onChange({ ...valor, pais, uf: e.target.value || null, cidade: null })}
            style={estiloCampo}
          >
            <option value="">Selecione</option>
            {estados.map((e) => (
              <option key={e.codigo} value={pais === 'BR' ? e.codigo : e.nome}>
                {pais === 'BR' ? `${e.nome} (${e.codigo})` : e.nome}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={valor.uf ?? ''}
            onChange={(e) => onChange({ ...valor, pais, uf: pais === 'BR' ? e.target.value.toUpperCase().slice(0, 2) : e.target.value.slice(0, 60) || null })}
            placeholder={estados === null && !estadosFalharam ? 'Carregando…' : pais === 'BR' ? 'Ex.: SP' : 'Digite o estado'}
            maxLength={pais === 'BR' ? 2 : 60}
            style={estiloCampo}
          />
        )}
      </Rotulo>

      <Rotulo texto={`Cidade${marca}`}>
        <input
          value={valor.cidade ?? ''}
          onChange={(e) => onChange({ ...valor, pais, cidade: e.target.value.slice(0, 100) || null })}
          list={cidades.length ? idLista : undefined}
          placeholder={estadoAtual || estadosFalharam ? 'Digite para buscar' : 'Escolha o estado primeiro'}
          maxLength={100}
          autoComplete="off"
          style={estiloCampo}
        />
        {cidades.length > 0 && (
          <datalist id={idLista}>
            {cidades.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        )}
      </Rotulo>
    </div>
  )
}
