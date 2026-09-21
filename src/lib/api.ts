import { obterRefreshToken, salvarSessao, limparSessao } from './auth'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

export class ApiError extends Error {}

async function tentarRenovarSessao(): Promise<boolean> {
  const refreshToken = obterRefreshToken()
  if (!refreshToken) return false
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      limparSessao()
      return false
    }
    const data = await res.json()
    salvarSessao(data)
    return true
  } catch {
    return false
  }
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  const token = typeof window !== 'undefined' ? localStorage.getItem('plura_admin_token') : null
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const rotasSemRetry = ['/auth/login', '/auth/signup', '/auth/refresh']
    if (res.status === 401 && !isRetry && !rotasSemRetry.includes(path)) {
      const renovou = await tentarRenovarSessao()
      if (renovou) {
        return request<T>(path, options, true)
      }
    }
    throw new ApiError(data?.error ?? 'Erro inesperado ao falar com o servidor')
  }

  return data as T
}

export interface AuthResponse {
  user: { id: string; email: string; nome?: string }
  access_token: string
  refresh_token: string
}

export interface Indicadores {
  usuarios: number
  contas_gov: number
  paginas_privadas: number
  paginas_publicas: number
  avaliacoes: number
  avaliacoes_sinalizadas: number
  certificados_pendentes: number
  certificados_aprovados: number
  certificados_reprovados: number
}

export interface Usuario {
  id: string
  cpf: string
  nome: string
  created_at: string
}

export interface GovConta {
  id: string
  nome: string
  orgao: string
  cidade: string
  nivel_acesso: number
  created_at: string
}

export interface Pagina {
  id: string
  tipo: 'privada' | 'publica'
  nome: string
  descricao: string | null
  created_at: string
}

export interface AvaliacaoSinalizada {
  id: string
  pagina_id: string
  pagina_nome: string
  nota: number
  comentario: string | null
  resposta: string | null
  created_at: string
}

export interface Certificado {
  id: string
  pagina_id: string
  pagina_nome: string
  status: 'pendente' | 'aprovado' | 'reprovado'
  solicitado_em: string
  avaliado_em?: string | null
}

export interface ConviteGov {
  token: string
  cidade: string
  criado_em: string
  expira_em: string
  usado: boolean
  usado_em: string | null
}

export interface Notificacao {
  id: string
  tipo: string
  titulo: string
  corpo: string
  entidade_tipo: string | null
  entidade_id: string | null
  lida: boolean
  lida_em: string | null
  criada_em: string
  metadata: Record<string, unknown>
}

export const api = {
  signup: (body: { codigo: string; nome: string; email: string; password: string }) =>
    request<AuthResponse | { message: string; pending_email_confirmation: true }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  indicadores: () => request<Indicadores>('/indicadores'),

  listarUsuarios: () => request<{ usuarios: Usuario[] }>('/contas/usuarios'),

  listarGovContas: () => request<{ contas: GovConta[] }>('/contas/gov'),

  listarPaginas: () => request<{ paginas: Pagina[] }>('/contas/paginas'),

  excluirConta: (id: string) => request<void>(`/contas/${id}`, { method: 'DELETE' }),

  avaliacoesSinalizadas: () => request<{ avaliacoes: AvaliacaoSinalizada[] }>('/avaliacoes/sinalizadas'),

  certificadosPendentes: () => request<{ certificados: Certificado[] }>('/certificados/pendentes'),

  atualizarCertificado: (id: string, status: 'aprovado' | 'reprovado') =>
    request<Certificado>(`/certificados/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  criarConvite: (body: { cidade: string; dias_validade?: number }) =>
    request<ConviteGov>('/convites-gov', { method: 'POST', body: JSON.stringify(body) }),

  listarConvites: () => request<{ convites: ConviteGov[] }>('/convites-gov'),

  listarNotificacoes: (apenasNaoLidas?: boolean) =>
    request<{ notificacoes: Notificacao[] }>(
      apenasNaoLidas ? '/notificacoes?status=nao_lidas&limit=30' : '/notificacoes?limit=30'
    ),

  contarNaoLidas: () => request<{ total: number }>('/notificacoes/contagem-nao-lidas'),

  marcarNotificacaoComoLida: (id: string) => request<void>(`/notificacoes/${id}/ler`, { method: 'PATCH' }),

  marcarTodasNotificacoesComoLidas: () => request<void>('/notificacoes/marcar-todas-lidas', { method: 'PATCH' }),
}
