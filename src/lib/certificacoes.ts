import type { Certificacao, EscopoCertificacao, StatusCertificacao, TipoCampoFormulario, TipoRequisito } from './api'

// Rótulos e textos das telas de certificações (Etapa 8a)

export const ROTULO_ESCOPO: Record<EscopoCertificacao, string> = { b2b: 'Empresas (B2B)', b2g: 'Órgãos públicos (Gov)', ambos: 'Empresas e órgãos públicos' }
export const ROTULO_STATUS: Record<StatusCertificacao, { texto: string; cor: string; fundo: string }> = {
  rascunho: { texto: 'Rascunho', cor: 'var(--c-text-2)', fundo: 'var(--c-glass-bg-sm)' },
  publicada: { texto: 'Publicada', cor: 'var(--c-success-text)', fundo: 'var(--c-success-soft)' },
  arquivada: { texto: 'Arquivada', cor: 'var(--c-text-3)', fundo: 'var(--c-divider)' },
}

export function regiao(c: Pick<Certificacao, 'pais' | 'uf' | 'cidade'>) {
  if (c.cidade) return `${c.cidade}/${c.uf}`
  if (c.uf) return `Estado: ${c.uf}`
  return c.pais === 'BR' ? 'Todo o Brasil' : `País: ${c.pais}`
}

export const ROTULO_TIPO_REQUISITO: Record<TipoRequisito, { texto: string; ajuda: string }> = {
  arquivo: { texto: 'Envio de arquivo', ajuda: 'Documento, foto ou PDF enviado pela empresa ou órgão (até 25 MB cada).' },
  texto: { texto: 'Resposta em texto', ajuda: 'Um campo de texto livre para explicar algo.' },
  formulario: { texto: 'Formulário', ajuda: 'Perguntas com respostas curtas, sim/não, datas, números ou opções.' },
  link: { texto: 'Link', ajuda: 'Endereço de um site, documento online ou página.' },
  video: { texto: 'Vídeo', ajuda: 'Link de um vídeo (YouTube, Vimeo, Instagram...).' },
  vistoria: { texto: 'Agendamento de vistoria', ajuda: 'A empresa ou órgão propõe datas para a visita técnica da Plura.' },
}

export const ROTULO_TIPO_CAMPO: Record<TipoCampoFormulario, string> = {
  texto_curto: 'Resposta curta',
  texto_longo: 'Resposta longa',
  numero: 'Número',
  data: 'Data',
  sim_nao: 'Sim ou não',
  opcoes: 'Escolha entre opções',
}
