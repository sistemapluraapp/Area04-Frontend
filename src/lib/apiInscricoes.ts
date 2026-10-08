import { ApiError, BASE_URL, request } from './api'
import type { TipoRequisito, CampoFormulario } from './api'

// Etapa 8d: análise das inscrições das páginas nas certificações

export type StatusInscricao = 'em_andamento' | 'enviada' | 'aprovada' | 'reprovada' | 'cancelada'
export type StatusResposta = 'rascunho' | 'enviada' | 'aprovada' | 'ajustes'
export type FiltroInscricoes = 'fila' | 'andamento' | 'certificadas' | 'a_vencer' | 'vencidas' | 'reprovadas' | 'canceladas'

export const FILTROS: { id: FiltroInscricoes; rotulo: string }[] = [
  { id: 'fila', rotulo: 'Para analisar' },
  { id: 'andamento', rotulo: 'Em preenchimento' },
  { id: 'certificadas', rotulo: 'Certificadas' },
  { id: 'a_vencer', rotulo: 'A vencer (60 dias)' },
  { id: 'vencidas', rotulo: 'Vencidas' },
  { id: 'reprovadas', rotulo: 'Reprovadas' },
  { id: 'canceladas', rotulo: 'Canceladas' },
]

export const ROTULO_STATUS_INSCRICAO: Record<StatusInscricao, { texto: string; cor: string; fundo: string }> = {
  em_andamento: { texto: 'Em preenchimento', cor: 'var(--c-accent-text)', fundo: 'var(--c-accent-soft)' },
  enviada: { texto: 'Para analisar', cor: 'var(--c-warning-text, #b45309)', fundo: 'var(--c-warning-soft, rgba(245,158,11,.14))' },
  aprovada: { texto: 'Certificada', cor: 'var(--c-success-text)', fundo: 'var(--c-success-soft)' },
  reprovada: { texto: 'Reprovada', cor: 'var(--c-danger-text)', fundo: 'var(--c-danger-soft)' },
  cancelada: { texto: 'Cancelada', cor: 'var(--c-text-3)', fundo: 'var(--c-glass-bg-sm)' },
}

export interface InscricaoResumo {
  id: string
  status: StatusInscricao
  created_at: string
  enviada_em: string | null
  decidida_em: string | null
  concedida_em: string | null
  expira_em: string | null
  analisada_por: string | null
  certificacao_id: string
  certificacao_titulo: string
  certificacao_icone: string | null
  pagina_id: string
  pagina_nome: string
  pagina_tipo: 'privada' | 'publica'
  pagina_cidade: string | null
  pagina_uf: string | null
  pagina_logo: string | null
  respostas_pendentes: number
}

export interface ArquivoItem {
  chave: string
  nome: string
  tamanho: number
  tipo: string
}

export interface RespostaAdm {
  requisito_id: string
  valor: {
    texto?: string
    url?: string
    respostas?: (string | null)[]
    itens?: (ArquivoItem | { data: string; periodo: 'manha' | 'tarde' })[]
    contato?: string
    observacoes?: string
    confirmada?: { data: string; periodo: 'manha' | 'tarde'; por?: string } | null
  }
  status: StatusResposta
  comentario_adm: string | null
  updated_at: string
  avaliada_por: string | null
  avaliada_em: string | null
}

export interface RequisitoAdm {
  id: string
  etapa_id: string
  titulo: string
  descricao: string | null
  tipo: TipoRequisito
  obrigatorio: boolean
  config: { campos?: CampoFormulario[]; max_arquivos?: number }
}

export interface InscricaoDetalheAdm extends InscricaoResumo {
  observacao_adm: string | null
  certificacao: {
    id: string
    titulo: string
    resumo: string | null
    icone: string | null
    validade_meses: number | null
    etapas: { id: string; titulo: string; descricao: string | null; modo: 'sequencial' | 'paralela'; requisitos: RequisitoAdm[] }[]
  }
  respostas: RespostaAdm[]
  etapas_liberadas: { etapa_id: string; aprovada: boolean }[]
  equipe: { nome: string | null; papel: string; cargo: string | null }[]
}

export const apiInscricoes = {
  listar: (filtro: FiltroInscricoes, busca: string) =>
    request<{ inscricoes: InscricaoResumo[]; contagens: Record<FiltroInscricoes, number> }>(
      `/certificacoes-inscricoes?filtro=${filtro}${busca ? `&busca=${encodeURIComponent(busca)}` : ''}`,
    ),
  obter: (id: string) => request<InscricaoDetalheAdm>(`/certificacoes-inscricoes/${id}`),
  avaliar: (id: string, requisitoId: string, status: 'aprovada' | 'ajustes' | 'enviada', comentario?: string) =>
    request<RespostaAdm>(`/certificacoes-inscricoes/${id}/respostas/${requisitoId}`, { method: 'PATCH', body: JSON.stringify({ status, comentario }) }),
  confirmarVistoria: (id: string, requisitoId: string, data: string, periodo: 'manha' | 'tarde') =>
    request<RespostaAdm>(`/certificacoes-inscricoes/${id}/vistoria/${requisitoId}`, { method: 'POST', body: JSON.stringify({ data, periodo }) }),
  concluir: (id: string, decisao: 'concluir' | 'reprovar', observacao: string) =>
    request<{ status: StatusInscricao }>(`/certificacoes-inscricoes/${id}/concluir`, { method: 'POST', body: JSON.stringify({ decisao, observacao }) }),
  baixarArquivo: async (id: string, requisitoId: string, item: ArquivoItem) => {
    const token = localStorage.getItem('plura_admin_token')
    const res = await fetch(`${BASE_URL}/certificacoes-inscricoes/${id}/arquivo?requisito=${requisitoId}&chave=${encodeURIComponent(item.chave)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new ApiError((await res.json().catch(() => ({})))?.error ?? 'Não foi possível baixar o arquivo')
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = item.nome
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  },
}

export function dataBr(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

export function tamanhoLegivel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}
