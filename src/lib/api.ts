import { obterRefreshToken, salvarSessao, limparSessao } from './auth'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

export class ApiError extends Error {}

function montarQuery(params?: Record<string, string | undefined>): string {
  if (!params) return ''
  const entradas = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entradas.length === 0) return ''
  const usp = new URLSearchParams(entradas as [string, string][])
  return `?${usp.toString()}`
}

function redirecionarParaLogin() {
  if (
    typeof window !== 'undefined' &&
    window.location.pathname !== '/login' &&
    window.location.pathname !== '/signup'
  ) {
    window.location.href = '/login'
  }
}

async function tentarRenovarSessao(): Promise<boolean> {
  const refreshToken = obterRefreshToken()
  if (!refreshToken) {
    limparSessao()
    redirecionarParaLogin()
    return false
  }
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      limparSessao()
      redirecionarParaLogin()
      return false
    }
    const data = await res.json()
    salvarSessao(data)
    return true
  } catch {
    limparSessao()
    redirecionarParaLogin()
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
  cidade?: string | null
  uf?: string | null
  suspenso?: boolean
  email?: string
  created_at: string
}

export interface GovConta {
  id: string
  nome: string
  orgao: string
  cidade: string
  uf?: string | null
  nivel_acesso: number
  suspenso?: boolean
  email?: string
  created_at: string
}

export interface Pagina {
  id: string
  tipo: 'privada' | 'publica'
  nome: string
  descricao: string | null
  cidade?: string | null
  uf?: string | null
  endereco?: string | null
  suspensa?: boolean
  latitude?: number | null
  longitude?: number | null
  created_at: string
}

export interface AvaliacaoSinalizada {
  id: string
  pagina_id: string
  pagina_nome: string
  nota: number
  comentario: string | null
  resposta: string | null
  sinalizada?: boolean
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
  uf?: string | null
  criado_em: string
  expira_em: string
  usado: boolean
  usado_em: string | null
}

export interface Estatisticas {
  meses: string[]
  usuarios_por_mes: number[]
  empresas_por_mes: number[]
  gov_por_mes: number[]
  logins_pessoa_empresa_por_mes: number[]
  logins_gov_por_mes: number[]
}

export interface EstatisticasPorAno {
  ano: number
  meses: string[]
  usuarios_por_mes: number[]
  empresas_por_mes: number[]
  gov_por_mes: number[]
}

export interface LoginsPorDia {
  ano: number
  mes: number
  dias: string[]
  logins_pessoa_empresa_por_dia: number[]
  logins_gov_por_dia: number[]
}

export interface Filtro {
  id: string
  tipo: 'recurso_local' | 'necessidade_pessoal'
  categoria: string
  codigo: string
  rotulo: string
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
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

  estatisticas: () => request<Estatisticas>('/estatisticas'),

  listarFiltros: () => request<{ filtros: Filtro[] }>('/filtros'),

  criarFiltro: (body: { tipo: Filtro['tipo']; categoria: string; codigo: string; rotulo: string; ordem?: number }) =>
    request<Filtro>('/filtros', { method: 'POST', body: JSON.stringify(body) }),

  atualizarFiltro: (id: string, body: Partial<Pick<Filtro, 'categoria' | 'rotulo' | 'ordem' | 'ativo'>>) =>
    request<Filtro>(`/filtros/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  reordenarFiltros: (itens: { id: string; ordem: number }[]) =>
    request<void>('/filtros/reordenar', { method: 'PATCH', body: JSON.stringify({ itens }) }),

  excluirFiltro: (id: string) => request<void>(`/filtros/${id}`, { method: 'DELETE' }),

  listarUsuarios: (filtros?: { nome?: string; uf?: string }) =>
    request<{ usuarios: Usuario[] }>(`/contas/usuarios${montarQuery(filtros)}`),

  listarGovContas: (filtros?: { nome?: string; uf?: string }) =>
    request<{ contas: GovConta[] }>(`/contas/gov${montarQuery(filtros)}`),

  listarPaginas: (filtros?: { nome?: string; uf?: string }) =>
    request<{ paginas: Pagina[] }>(`/contas/paginas${montarQuery(filtros)}`),

  excluirConta: (id: string) => request<void>(`/contas/${id}`, { method: 'DELETE' }),

  suspenderUsuario: (id: string) =>
    request<{ id: string; suspenso: boolean }>(`/contas/usuarios/${id}/suspender`, { method: 'PATCH' }),

  suspenderGov: (id: string) =>
    request<{ id: string; suspenso: boolean }>(`/contas/gov/${id}/suspender`, { method: 'PATCH' }),

  suspenderPagina: (id: string) =>
    request<{ id: string; suspensa: boolean }>(`/contas/paginas/${id}/suspender`, { method: 'PATCH' }),

  atualizarUfUsuario: (id: string, uf: string) =>
    request<{ id: string; uf: string }>(`/contas/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify({ uf }) }),

  atualizarUfGov: (id: string, uf: string) =>
    request<{ id: string; uf: string }>(`/contas/gov/${id}`, { method: 'PATCH', body: JSON.stringify({ uf }) }),

  avaliacoesSinalizadas: () => request<{ avaliacoes: AvaliacaoSinalizada[] }>('/avaliacoes/sinalizadas'),

  avaliacoesTodas: () => request<{ avaliacoes: AvaliacaoSinalizada[] }>('/avaliacoes/todas'),

  certificadosPendentes: () => request<{ certificados: Certificado[] }>('/certificados/pendentes'),

  atualizarCertificado: (id: string, status: 'aprovado' | 'reprovado') =>
    request<Certificado>(`/certificados/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  criarConvite: (body: { cidade: string; uf?: string; dias_validade?: number }) =>
    request<ConviteGov>('/convites-gov', { method: 'POST', body: JSON.stringify(body) }),

  listarConvites: () => request<{ convites: ConviteGov[] }>('/convites-gov'),

  estatisticasPorAno: (ano: number) => request<EstatisticasPorAno>(`/estatisticas/por-ano?ano=${ano}`),

  estatisticasLoginsPorDia: (ano: number, mes: number) =>
    request<LoginsPorDia>(`/estatisticas/logins-por-dia?ano=${ano}&mes=${mes}`),

  listarNotificacoes: (apenasNaoLidas?: boolean) =>
    request<{ notificacoes: Notificacao[] }>(
      apenasNaoLidas ? '/notificacoes?status=nao_lidas&limit=30' : '/notificacoes?limit=30'
    ),

  contarNaoLidas: () => request<{ total: number }>('/notificacoes/contagem-nao-lidas'),

  marcarNotificacaoComoLida: (id: string) => request<void>(`/notificacoes/${id}/ler`, { method: 'PATCH' }),

  marcarTodasNotificacoesComoLidas: () => request<void>('/notificacoes/marcar-todas-lidas', { method: 'PATCH' }),
}
