'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { IconArrowDown, IconArrowUp, IconTrash } from '@tabler/icons-react'
import IconePicker from './IconePicker'
import type { Escopo } from '@/lib/api'

export const ESCOPO_LABEL: Record<Escopo, string> = {
  ambos: 'B2B e B2G',
  b2b: 'Só B2B (empresas)',
  b2g: 'Só B2G (governo)',
}

export const campoStyle = {
  padding: '0.5rem 0.75rem',
  borderRadius: '0.625rem',
  border: '1px solid var(--c-input-border)',
  background: 'var(--c-input-bg)',
  color: 'var(--c-input-text)',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
} as const

export function Switch({ ativo, onChange, titulo }: { ativo: boolean; onChange: () => void; titulo?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      aria-label={titulo ?? (ativo ? 'Desativar' : 'Ativar')}
      title={titulo ?? (ativo ? 'Ativo — clique para desativar' : 'Inativo — clique para ativar')}
      onClick={onChange}
      style={{
        width: '2.25rem',
        height: '1.25rem',
        borderRadius: '9999px',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        background: ativo ? 'linear-gradient(135deg, #1a7aff 0%, #0062e6 100%)' : 'var(--c-text-4)',
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
          background: '#ffffff',
          transition: 'left 150ms ease',
        }}
      />
    </button>
  )
}

function BotaoIcone({ onClick, titulo, children, perigo, desativado }: { onClick: () => void; titulo: string; children: ReactNode; perigo?: boolean; desativado?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativado}
      title={titulo}
      aria-label={titulo}
      style={{
        background: 'none',
        border: '1px solid var(--c-divider)',
        borderRadius: '0.5rem',
        padding: '0.3rem',
        display: 'inline-flex',
        cursor: desativado ? 'default' : 'pointer',
        opacity: desativado ? 0.35 : 1,
        color: perigo ? 'var(--c-danger-text)' : 'var(--c-text-2)',
      }}
    >
      {children}
    </button>
  )
}

// Linha de um item editável (catálogo ou recurso de acessibilidade):
// ícone, rótulo (salva ao sair do campo), escopo, ativo, ordem e exclusão.
export default function ItemEditavel({
  codigo,
  rotulo,
  icone,
  escopo,
  ativo,
  primeiro,
  ultimo,
  extra,
  onAtualizar,
  onSubir,
  onDescer,
  onExcluir,
}: {
  codigo: string
  rotulo: string
  icone: string | null
  escopo?: Escopo
  ativo: boolean
  primeiro: boolean
  ultimo: boolean
  extra?: ReactNode
  onAtualizar: (patch: { rotulo?: string; icone?: string; escopo?: Escopo; ativo?: boolean }) => void
  onSubir: () => void
  onDescer: () => void
  onExcluir: () => void
}) {
  const [texto, setTexto] = useState(rotulo)
  useEffect(() => setTexto(rotulo), [rotulo])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        flexWrap: 'wrap',
        padding: '0.625rem 0.75rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--c-divider)',
        background: ativo ? 'var(--c-glass-bg-sm)' : 'transparent',
        opacity: ativo ? 1 : 0.6,
      }}
    >
      <IconePicker valor={icone} onChange={(i) => onAtualizar({ icone: i })} />
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => texto.trim() && texto.trim() !== rotulo && onAtualizar({ rotulo: texto.trim() })}
          aria-label="Nome"
          style={{ ...campoStyle, width: '100%' }}
        />
        <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)' }}>{codigo}</span>
      </div>
      {extra}
      {escopo && (
        <select value={escopo} onChange={(e) => onAtualizar({ escopo: e.target.value as Escopo })} aria-label="Onde aparece" style={campoStyle}>
          {(Object.keys(ESCOPO_LABEL) as Escopo[]).map((e) => (
            <option key={e} value={e}>
              {ESCOPO_LABEL[e]}
            </option>
          ))}
        </select>
      )}
      <Switch ativo={ativo} onChange={() => onAtualizar({ ativo: !ativo })} />
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <BotaoIcone onClick={onSubir} titulo="Subir" desativado={primeiro}>
          <IconArrowUp size={16} />
        </BotaoIcone>
        <BotaoIcone onClick={onDescer} titulo="Descer" desativado={ultimo}>
          <IconArrowDown size={16} />
        </BotaoIcone>
        <BotaoIcone onClick={onExcluir} titulo="Excluir" perigo>
          <IconTrash size={16} />
        </BotaoIcone>
      </div>
    </div>
  )
}

export function slugify(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
