import DOMPurify from 'dompurify'

// Textos com formatação são guardados como HTML (gerado pelo EditorRico).
// Textos cadastrados antes do editor são texto puro e continuam válidos:
// paraHtml() converte quebras de linha em parágrafos na hora de exibir/editar.

const TAGS_PERMITIDAS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'h3', 'h4', 'a']
const ATRIBUTOS_PERMITIDOS = ['href', 'target', 'rel', 'style']

export function pareceHtml(valor: string): boolean {
  return /<\/?(p|br|strong|b|em|i|u|s|ul|ol|li|h[1-6]|a)\b[^>]*>/i.test(valor)
}

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Mesma regra do texto livre antigo: parágrafos separados por linha em branco,
// linhas iniciadas por "- " viram lista e links http(s) ficam clicáveis
export function paraHtml(valor: string | null | undefined): string {
  const v = (valor ?? '').trim()
  if (!v) return ''
  if (pareceHtml(v)) return v
  const comLinks = (linha: string) =>
    escaparHtml(linha).replace(/(https?:\/\/[^\s<]+)/g, (url) => `<a href="${url}">${url}</a>`)
  return v
    .split(/\n\s*\n/)
    .map((bloco) => {
      const linhas = bloco.split('\n')
      if (linhas.every((l) => /^\s*[-•]\s+/.test(l))) {
        return `<ul>${linhas.map((l) => `<li>${comLinks(l.replace(/^\s*[-•]\s+/, ''))}</li>`).join('')}</ul>`
      }
      return `<p>${linhas.map(comLinks).join('<br>')}</p>`
    })
    .join('')
}

// Texto visível, sem tags — usado em contadores, resumos e leitores de cartão
export function textoVisivel(valor: string | null | undefined): string {
  const v = valor ?? ''
  if (!pareceHtml(v)) return v
  return v
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function tamanhoTexto(valor: string | null | undefined): number {
  return textoVisivel(valor).replace(/\n/g, '').length
}

let hooksRegistrados = false

function registrarHooks() {
  if (hooksRegistrados) return
  hooksRegistrados = true
  DOMPurify.addHook('uponSanitizeAttribute', (_no, dado) => {
    // De estilos, só o alinhamento de parágrafo é aceito
    if (dado.attrName === 'style') {
      const alinhamento = /text-align:\s*(left|center|right|justify)/i.exec(dado.attrValue)
      dado.attrValue = alinhamento ? `text-align: ${alinhamento[1].toLowerCase()}` : ''
      if (!alinhamento) dado.keepAttr = false
    }
  })
  DOMPurify.addHook('afterSanitizeAttributes', (no) => {
    if (no.tagName === 'A') {
      no.setAttribute('target', '_blank')
      no.setAttribute('rel', 'noopener noreferrer nofollow')
    }
  })
}

export function sanitizarHtml(html: string): string {
  // O DOMPurify precisa do DOM do navegador; no pré-render estático não há conteúdo a exibir
  if (typeof window === 'undefined' || !html) return ''
  registrarHooks()
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: TAGS_PERMITIDAS,
    ALLOWED_ATTR: ATRIBUTOS_PERMITIDOS,
    ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:)/i,
  })
}
