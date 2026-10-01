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
    window.location.pathname !== '/signup' &&
    window.location.pathname !== '/aceitar-convite'
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

export interface PermissaoDisponivel {
  codigo: string
  rotulo: string
}

export interface AdminLogado {
  id: string
  nome: string
  email: string
  permissoes: string[]
}

export interface Administrador {
  id: string
  nome: string | null
  email: string | null
  ativo: boolean
  permissoes: string[]
  created_at: string
}

export interface ConviteAdmin {
  id: string
  nome: string
  email: string
  permissoes: string[]
  expira_em: string
  criado_em: string
}

export interface LogAdmin {
  id: number
  admin_id: string
  admin_nome: string | null
  admin_email: string | null
  acao: string
  funcionalidade: string | null
  criado_em: string
}

export interface FiltrosLog {
  de?: string
  ate?: string
  admin?: string
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

export type Escopo = 'b2b' | 'b2g' | 'ambos'

export interface Filtro {
  id: string
  tipo: 'recurso_local' | 'necessidade_pessoal'
  categoria: string
  codigo: string
  rotulo: string
  icone: string | null
  descricao: string | null
  escopo: Escopo
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface GrupoAcessibilidade {
  codigo: string
  rotulo: string
  descricao: string | null
  icone: string | null
  ordem: number
  ativo: boolean
  total_recursos: number
}

export type TipoCatalogo = 'categoria' | 'tag' | 'preferencia_turismo' | 'antes_de_ir'

export interface ItemCatalogo {
  id: string
  tipo: TipoCatalogo
  codigo: string
  rotulo: string
  icone: string | null
  descricao?: string | null
  escopo: Escopo
  ordem: number
  ativo: boolean
}

export type StatusComentario = 'pendente' | 'aprovado' | 'reprovado'

export interface ComentarioModeracao {
  id: string
  pagina_id: string
  pagina_nome: string
  usuario_id: string
  usuario_nome: string | null
  usuario_avatar_url: string | null
  nota: number
  comentario: string | null
  status: StatusComentario
  motivo_moderacao: string | null
  moderado_em: string | null
  sinalizada: boolean
  created_at: string
}

export type StatusDenuncia = 'pendente' | 'resolvida' | 'descartada'

export interface Denuncia {
  id: string
  pagina_id: string
  pagina_nome: string
  usuario_id: string
  usuario_nome: string | null
  motivo: string
  comentario: string | null
  status: StatusDenuncia
  observacao_admin: string | null
  resolvida_em: string | null
  created_at: string
}

export type FaseConsumo = 'tranquilo' | 'prepare-se' | 'planeje' | 'critico'

export interface RecursoInfraestrutura {
  recurso: string
  rotulo: string
  limite: number
  unidade: 'bytes' | 'usuarios' | 'requisicoes'
  periodo: 'total' | 'mes' | 'dia'
  uso: number | null
  percentual: number | null
  fase: FaseConsumo | null
  erro?: string
  aviso?: string
  detalhes?: { nome: string; uso: number | null; erro?: string }[]
  previsao: { texto: string; percentual_fim_periodo?: number; dias_ate_teto?: number } | null
  historico: { dia: string; uso: number }[]
}

export interface ConsumoInfraestrutura {
  atualizado_em: string
  painel_supabase: string
  recursos: RecursoInfraestrutura[]
  maiores_tabelas: { nome: string; bytes: number; projeto: string }[]
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

// E-mails e boas-vindas (modelos editáveis)
export type PosicaoImagem = 'topo' | 'assinatura' | 'nenhuma'
export type EstiloAcao = 'botao' | 'imagem'

export interface Termo {
  chave: string
  nome: string
  descricao: string | null
  titulo: string
  conteudo_html: string
  atualizado_em: string
  atualizado_por: string | null
}

export interface ModeloComunicacao {
  chave: string
  tipo: 'email' | 'pagina'
  nome: string
  descricao: string | null
  assunto: string | null
  titulo: string | null
  corpo_html: string | null
  botao_texto: string | null
  imagem_url: string | null
  imagem_link: string | null
  imagem_posicao: PosicaoImagem
  acao_estilo: EstiloAcao
  atualizado_em: string
  atualizado_por: string | null
}

export type RascunhoModelo = Pick<ModeloComunicacao, 'assunto' | 'titulo' | 'corpo_html' | 'botao_texto' | 'imagem_url' | 'imagem_link' | 'imagem_posicao' | 'acao_estilo'>

export const api = {
  listarModelos: () => request<{ modelos: ModeloComunicacao[] }>('/comunicacao'),

  listarTermos: () => request<{ termos: Termo[] }>('/termos'),

  salvarTermo: (chave: string, body: { titulo: string; conteudo_html: string }) =>
    request<Termo>(`/termos/${chave}`, { method: 'PUT', body: JSON.stringify(body) }),

  salvarModelo: (chave: string, body: RascunhoModelo) =>
    request<ModeloComunicacao>(`/comunicacao/${chave}`, { method: 'PUT', body: JSON.stringify(body) }),

  previaModelo: (chave: string, body: RascunhoModelo) =>
    request<{ assunto: string; html: string }>(`/comunicacao/${chave}/previa`, { method: 'POST', body: JSON.stringify(body) }),

  testarModelo: (chave: string, body: RascunhoModelo) =>
    request<{ enviado_para: string }>(`/comunicacao/${chave}/teste`, { method: 'POST', body: JSON.stringify(body) }),

  consumoInfraestrutura: () => request<ConsumoInfraestrutura>('/infraestrutura'),

  atualizarLimiteInfraestrutura: (recurso: string, limite: number) =>
    request<{ recurso: string; limite: number }>(`/infraestrutura/limites/${recurso}`, { method: 'PATCH', body: JSON.stringify({ limite }) }),

  // Administradores, permissões e logs
  meuAcesso: () => request<{ admin: AdminLogado; permissoes_disponiveis: PermissaoDisponivel[] }>('/me'),

  listarAdmins: () => request<{ admins: Administrador[]; convites: ConviteAdmin[]; permissoes_disponiveis: PermissaoDisponivel[] }>('/admins'),

  atualizarAdmin: (id: string, body: { permissoes?: string[]; ativo?: boolean }) =>
    request<Administrador>(`/admins/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  convidarAdmin: (body: { nome: string; email: string; permissoes: string[] }) =>
    request<ConviteAdmin & { aviso?: string; link_convite?: string }>('/admins/convites', { method: 'POST', body: JSON.stringify(body) }),

  reenviarConviteAdmin: (id: string) =>
    request<ConviteAdmin & { aviso?: string; link_convite?: string }>(`/admins/convites/${id}/reenviar`, { method: 'POST' }),

  cancelarConviteAdmin: (id: string) => request<{ ok: true }>(`/admins/convites/${id}`, { method: 'DELETE' }),

  listarLogs: (filtros: FiltrosLog & { antes_id?: string }) =>
    request<{ logs: LogAdmin[]; tem_mais: boolean }>(`/logs${montarQuery({ ...filtros, limite: '100' })}`),

  // O CSV vem como arquivo: baixa com o token e entrega ao navegador
  baixarLogsCsv: async (filtros: FiltrosLog) => {
    const token = localStorage.getItem('plura_admin_token')
    const res = await fetch(`${BASE_URL}/logs/csv${montarQuery({ ...filtros })}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (!res.ok) throw new ApiError((await res.json().catch(() => ({})))?.error ?? 'Não foi possível exportar')
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-plura-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  },

  verConviteAdmin: (token: string) => request<{ email: string; nome: string }>(`/convites-admin/${encodeURIComponent(token)}`),

  aceitarConviteAdmin: (token: string, senha: string) =>
    request<AuthResponse>(`/convites-admin/${encodeURIComponent(token)}/aceitar`, { method: 'POST', body: JSON.stringify({ senha }) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  indicadores: () => request<Indicadores>('/indicadores'),

  estatisticas: () => request<Estatisticas>('/estatisticas'),

  listarFiltros: () => request<{ filtros: Filtro[] }>('/filtros'),

  criarFiltro: (body: {
    tipo: Filtro['tipo']
    categoria: string
    codigo: string
    rotulo: string
    ordem?: number
    icone?: string | null
    descricao?: string | null
    escopo?: Escopo
  }) => request<Filtro>('/filtros', { method: 'POST', body: JSON.stringify(body) }),

  atualizarFiltro: (
    id: string,
    body: Partial<Pick<Filtro, 'categoria' | 'rotulo' | 'ordem' | 'ativo' | 'icone' | 'descricao' | 'escopo'>>
  ) =>
    request<Filtro>(`/filtros/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  reordenarFiltros: (itens: { id: string; ordem: number }[]) =>
    request<void>('/filtros/reordenar', { method: 'PATCH', body: JSON.stringify({ itens }) }),

  excluirFiltro: (id: string) => request<void>(`/filtros/${id}`, { method: 'DELETE' }),

  listarGrupos: () => request<{ grupos: GrupoAcessibilidade[] }>('/grupos-acessibilidade'),

  criarGrupo: (body: { codigo: string; rotulo: string; descricao?: string | null; icone?: string | null; ordem?: number }) =>
    request<GrupoAcessibilidade>('/grupos-acessibilidade', { method: 'POST', body: JSON.stringify(body) }),

  atualizarGrupo: (codigo: string, body: Partial<Pick<GrupoAcessibilidade, 'rotulo' | 'descricao' | 'icone' | 'ordem' | 'ativo'>>) =>
    request<GrupoAcessibilidade>(`/grupos-acessibilidade/${codigo}`, { method: 'PATCH', body: JSON.stringify(body) }),

  excluirGrupo: (codigo: string) => request<void>(`/grupos-acessibilidade/${codigo}`, { method: 'DELETE' }),

  listarCatalogo: (tipo: TipoCatalogo) => request<{ itens: ItemCatalogo[] }>(`/catalogo?tipo=${tipo}`),

  criarItemCatalogo: (body: { tipo: TipoCatalogo; codigo: string; rotulo: string; icone?: string | null; escopo?: Escopo; ordem?: number }) =>
    request<ItemCatalogo>('/catalogo', { method: 'POST', body: JSON.stringify(body) }),

  atualizarItemCatalogo: (id: string, body: Partial<Pick<ItemCatalogo, 'rotulo' | 'icone' | 'descricao' | 'escopo' | 'ordem' | 'ativo'>>) =>
    request<ItemCatalogo>(`/catalogo/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  reordenarCatalogo: (itens: { id: string; ordem: number }[]) =>
    request<void>('/catalogo/reordenar', { method: 'PATCH', body: JSON.stringify({ itens }) }),

  excluirItemCatalogo: (id: string) => request<void>(`/catalogo/${id}`, { method: 'DELETE' }),

  listarComentarios: (filtros: { status?: StatusComentario; pessoa?: string; empreendimento?: string }) =>
    request<{ comentarios: ComentarioModeracao[] }>(`/comentarios${montarQuery(filtros)}`),

  moderarComentario: (id: string, status: StatusComentario, motivo?: string) =>
    request<Pick<ComentarioModeracao, 'id' | 'status' | 'motivo_moderacao' | 'moderado_em'>>(`/comentarios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, motivo }),
    }),

  listarDenuncias: (status?: StatusDenuncia) => request<{ denuncias: Denuncia[] }>(`/denuncias${montarQuery({ status })}`),

  atualizarDenuncia: (id: string, status: StatusDenuncia, observacao_admin?: string) =>
    request<Pick<Denuncia, 'id' | 'status' | 'observacao_admin' | 'resolvida_em'>>(`/denuncias/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, observacao_admin }),
    }),

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
