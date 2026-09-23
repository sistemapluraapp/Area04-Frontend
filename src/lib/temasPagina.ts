export type TemaPagina =
  | 'plura'
  | 'azul_claro'
  | 'azul_escuro'
  | 'verde'
  | 'amarelo'
  | 'rosa'
  | 'branca'
  | 'marrom'
  | 'cinza'

// Cores de destaque disponíveis para a página do empreendimento. As variáveis
// CSS de cada tema (--p-accent etc.) ficam em globals.css ([data-tema=...]).
export const TEMAS_PAGINA: { codigo: TemaPagina; rotulo: string; amostra: string }[] = [
  { codigo: 'plura', rotulo: 'Atual (Plura)', amostra: '#1a7aff' },
  { codigo: 'azul_claro', rotulo: 'Azul claro', amostra: '#0ea5e9' },
  { codigo: 'azul_escuro', rotulo: 'Azul escuro', amostra: '#1e3a8a' },
  { codigo: 'verde', rotulo: 'Verde', amostra: '#0f9d58' },
  { codigo: 'amarelo', rotulo: 'Amarelo', amostra: '#f59e0b' },
  { codigo: 'rosa', rotulo: 'Rosa', amostra: '#ec4899' },
  { codigo: 'branca', rotulo: 'Branca', amostra: '#f3f4f6' },
  { codigo: 'marrom', rotulo: 'Marrom', amostra: '#8b5e34' },
  { codigo: 'cinza', rotulo: 'Cinza', amostra: '#4b5563' },
]

export function temaValido(tema: string | null | undefined): TemaPagina {
  return TEMAS_PAGINA.some((t) => t.codigo === tema) ? (tema as TemaPagina) : 'plura'
}
