// Etapa 10: tradução automática das páginas com o tradutor do Google.
// A escolha fica no cookie "googtrans" (lido pelo próprio script do Google);
// em português nada é carregado.

export const IDIOMAS = [
  { codigo: 'pt', nome: 'Português' },
  { codigo: 'en', nome: 'English' },
  { codigo: 'es', nome: 'Español' },
  { codigo: 'fr', nome: 'Français' },
  { codigo: 'it', nome: 'Italiano' },
  { codigo: 'de', nome: 'Deutsch' },
] as const

export type CodigoIdioma = (typeof IDIOMAS)[number]['codigo']

export function idiomaAtual(): CodigoIdioma {
  if (typeof document === 'undefined') return 'pt'
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[a-z-]+\/([a-zA-Z-]+)/)
  const codigo = m?.[1] as CodigoIdioma | undefined
  return codigo && IDIOMAS.some((i) => i.codigo === codigo) ? codigo : 'pt'
}

function gravarCookie(valor: string | null) {
  const host = window.location.hostname
  // Vale para o domínio atual e para *.plura.app.br (troca de área mantém o idioma)
  const dominios = [host, ...(host.endsWith('plura.app.br') ? ['.plura.app.br'] : [])]
  for (const d of dominios) {
    document.cookie = valor
      ? `googtrans=${valor}; path=/; domain=${d}; max-age=31536000; SameSite=Lax`
      : `googtrans=; path=/; domain=${d}; max-age=0`
  }
  document.cookie = valor ? `googtrans=${valor}; path=/; max-age=31536000; SameSite=Lax` : 'googtrans=; path=/; max-age=0'
}

export function mudarIdioma(codigo: CodigoIdioma) {
  gravarCookie(codigo === 'pt' ? null : `/pt/${codigo}`)
  window.location.reload()
}

let carregado = false
// Carrega o tradutor só quando há idioma escolhido diferente de português
export function iniciarTraducao() {
  if (carregado || typeof window === 'undefined' || idiomaAtual() === 'pt') return
  carregado = true
  const w = window as unknown as Record<string, unknown>
  w.googleTranslateElementInit = () => {
    const g = (window as unknown as { google?: { translate?: { TranslateElement: new (o: object, id: string) => unknown } } }).google
    if (!g?.translate) return
    new g.translate.TranslateElement({ pageLanguage: 'pt', includedLanguages: IDIOMAS.map((i) => i.codigo).join(','), autoDisplay: false }, 'google_translate_element')
  }
  if (!document.getElementById('google_translate_element')) {
    const alvo = document.createElement('div')
    alvo.id = 'google_translate_element'
    alvo.style.display = 'none'
    document.body.appendChild(alvo)
  }
  const s = document.createElement('script')
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  s.async = true
  document.body.appendChild(s)
}
