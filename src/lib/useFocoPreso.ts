import { useEffect, type RefObject } from 'react'

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'

// Mantém o foco do teclado (e do leitor de tela) dentro de um modal aberto:
// ao abrir, leva o foco para dentro; Tab e Shift+Tab circulam só pelos
// elementos do modal; ao fechar, devolve o foco para onde a pessoa estava.
export function useFocoPreso(ref: RefObject<HTMLElement | null>, ativo = true) {
  useEffect(() => {
    if (!ativo) return
    const container = ref.current
    if (!container) return
    const anterior = document.activeElement as HTMLElement | null

    const focaveis = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCAVEIS)).filter((el) => el.offsetParent !== null || el === document.activeElement)

    // Espera o conteúdo do modal montar antes de focar
    const inicio = window.setTimeout(() => {
      if (container.contains(document.activeElement)) return
      const primeiro = container.querySelector<HTMLElement>('[autofocus], [data-foco-inicial]') ?? focaveis()[0]
      if (primeiro) primeiro.focus()
      else {
        if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1')
        container.focus()
      }
    }, 30)

    function aoTeclar(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const lista = focaveis()
      if (lista.length === 0) {
        e.preventDefault()
        return
      }
      const primeiro = lista[0]
      const ultimo = lista[lista.length - 1]
      if (e.shiftKey && (document.activeElement === primeiro || !container!.contains(document.activeElement))) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && (document.activeElement === ultimo || !container!.contains(document.activeElement))) {
        e.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', aoTeclar)
    return () => {
      window.clearTimeout(inicio)
      document.removeEventListener('keydown', aoTeclar)
      if (anterior && document.contains(anterior)) anterior.focus()
    }
  }, [ref, ativo])
}
