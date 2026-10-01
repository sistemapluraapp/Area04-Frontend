'use client'

import { useEffect } from 'react'

// Título da aba do navegador no padrão "Seção · Plura". O Next reaplica o
// título padrão do layout depois da hidratação, então o hook observa o <head>
// e devolve o título da seção enquanto a tela estiver aberta.
export function useTituloPagina(titulo: string | null | undefined) {
  useEffect(() => {
    if (!titulo) return
    const alvo = `${titulo} · Plura`
    const aplicar = () => {
      if (document.title !== alvo) document.title = alvo
    }
    aplicar()
    const observador = new MutationObserver(aplicar)
    observador.observe(document.head, { subtree: true, childList: true, characterData: true })
    return () => observador.disconnect()
  }, [titulo])
}
