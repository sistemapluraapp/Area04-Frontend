// Modo claro/escuro da plataforma. A plataforma sempre abre no modo claro,
// a menos que o usuário tenha escolhido o escuro antes (salvo neste navegador).

export type Modo = 'claro' | 'escuro'

const CHAVE = 'plura_modo'

export function obterModo(): Modo {
  try {
    return localStorage.getItem(CHAVE) === 'escuro' ? 'escuro' : 'claro'
  } catch {
    return 'claro'
  }
}

export function aplicarModo(modo: Modo): void {
  if (modo === 'escuro') document.documentElement.setAttribute('data-theme', 'dark')
  else document.documentElement.removeAttribute('data-theme')
  try {
    localStorage.setItem(CHAVE, modo)
  } catch {
    // armazenamento indisponível (aba anônima etc.): o modo vale só nesta visita
  }
  window.dispatchEvent(new CustomEvent('plura-modo', { detail: modo }))
}

// Executado no <head>, antes da página aparecer, para não piscar o modo claro
// quando o usuário prefere o escuro.
export const SCRIPT_MODO_INICIAL = `try{if(localStorage.getItem('${CHAVE}')==='escuro')document.documentElement.setAttribute('data-theme','dark')}catch(e){}`
