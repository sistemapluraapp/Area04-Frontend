import Icone from './Icone'

// Selo da etiqueta como aparece para o público (cards e topo da página)
export default function EtiquetaChip({ titulo, icone, tamanho = 'normal' }: { titulo: string; icone: string | null; tamanho?: 'normal' | 'pequeno' }) {
  const pequeno = tamanho === 'pequeno'
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem', maxWidth: '100%',
        padding: pequeno ? '0.15rem 0.5rem' : '0.25rem 0.7rem', borderRadius: '9999px',
        background: 'var(--c-accent-soft)', border: '1px solid var(--c-accent-soft-border)', color: 'var(--c-accent-text)',
        fontSize: pequeno ? '0.6875rem' : '0.8125rem', fontWeight: 700, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}
    >
      {icone && <Icone nome={icone} size={pequeno ? 13 : 15} />}
      {titulo}
    </span>
  )
}
