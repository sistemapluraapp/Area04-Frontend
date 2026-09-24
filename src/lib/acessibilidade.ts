// Preferências de acessibilidade da plataforma (salvas neste navegador, como o
// modo claro/escuro). Nada muda na tela até a pessoa ativar alguma opção.

export type TamanhoTexto = 'normal' | 'grande' | 'maior'

export interface PreferenciasAcessibilidade {
  libras: boolean
  texto: TamanhoTexto
  reduzirMovimento: boolean
  altoContraste: boolean
}

const CHAVE = 'plura_acessibilidade'
export const EVENTO_ACESSIBILIDADE = 'plura-acessibilidade'

export const PADRAO: PreferenciasAcessibilidade = { libras: false, texto: 'normal', reduzirMovimento: false, altoContraste: false }

export function obterPreferencias(): PreferenciasAcessibilidade {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as Partial<PreferenciasAcessibilidade>
    return {
      libras: salvo.libras === true,
      texto: salvo.texto === 'grande' || salvo.texto === 'maior' ? salvo.texto : 'normal',
      reduzirMovimento: salvo.reduzirMovimento === true,
      altoContraste: salvo.altoContraste === true,
    }
  } catch {
    return { ...PADRAO }
  }
}

function aplicarNoDocumento(p: PreferenciasAcessibilidade) {
  const raiz = document.documentElement
  raiz.setAttribute('data-texto', p.texto)
  if (p.reduzirMovimento) raiz.setAttribute('data-movimento', 'reduzido')
  else raiz.removeAttribute('data-movimento')
  if (p.libras) raiz.setAttribute('data-libras', 'on')
  else raiz.removeAttribute('data-libras')
  if (p.altoContraste) raiz.setAttribute('data-contraste', 'alto')
  else raiz.removeAttribute('data-contraste')
}

export function salvarPreferencias(mudancas: Partial<PreferenciasAcessibilidade>): PreferenciasAcessibilidade {
  const novas = { ...obterPreferencias(), ...mudancas }
  aplicarNoDocumento(novas)
  try {
    localStorage.setItem(CHAVE, JSON.stringify(novas))
  } catch {
    // armazenamento indisponível: vale só nesta visita
  }
  window.dispatchEvent(new CustomEvent(EVENTO_ACESSIBILIDADE, { detail: novas }))
  return novas
}

// Executado no <head>, antes da página aparecer, para o texto já nascer no
// tamanho escolhido (sem "pular" depois de carregar).
export const SCRIPT_ACESSIBILIDADE_INICIAL = `try{var p=JSON.parse(localStorage.getItem('${CHAVE}')||'{}'),r=document.documentElement;if(p.texto==='grande'||p.texto==='maior')r.setAttribute('data-texto',p.texto);if(p.reduzirMovimento)r.setAttribute('data-movimento','reduzido');if(p.libras)r.setAttribute('data-libras','on');if(p.altoContraste)r.setAttribute('data-contraste','alto')}catch(e){}`
