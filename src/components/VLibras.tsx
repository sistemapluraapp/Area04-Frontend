'use client'

import { useEffect, useState } from 'react'
import { EVENTO_ACESSIBILIDADE, obterPreferencias, type PreferenciasAcessibilidade } from '@/lib/acessibilidade'

declare global {
  interface Window {
    VLibras?: { Widget: new (opcoes?: Record<string, unknown>) => unknown }
  }
}

const SCRIPT_URL = 'https://vlibras.gov.br/app/vlibras-plugin.js'
let scriptCarregado = false

// Tradutor de Libras do Governo Federal (VLibras). Só é baixado quando a
// pessoa ativa "Libras" no painel de Acessibilidade — para quem não usa, a
// página não fica mais pesada. Depois de ativado, aparece o botão azul com
// a mão no canto direito; tocando nele e depois em um texto, o avatar traduz.
export default function VLibras() {
  const [ativo, setAtivo] = useState(false)

  useEffect(() => {
    setAtivo(obterPreferencias().libras)
    const aoMudar = (e: Event) => setAtivo((e as CustomEvent<PreferenciasAcessibilidade>).detail.libras)
    window.addEventListener(EVENTO_ACESSIBILIDADE, aoMudar)
    return () => window.removeEventListener(EVENTO_ACESSIBILIDADE, aoMudar)
  }, [])

  useEffect(() => {
    if (!ativo || scriptCarregado) return
    scriptCarregado = true
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => {
      if (!window.VLibras) return
      new window.VLibras.Widget({ position: 'R' })
      // O widget se inicia no evento "load" da janela, que já passou quando
      // o script é carregado sob demanda.
      const aoCarregar = window.onload as ((this: Window, ev: Event) => unknown) | null
      aoCarregar?.call(window, new Event('load'))
    }
    script.onerror = () => {
      scriptCarregado = false
    }
    document.body.appendChild(script)
  }, [ativo])

  // A marcação fica sempre no DOM depois de ativada; desligar só a esconde
  // (via CSS em html:not([data-libras])), porque o VLibras não se desmonta.
  if (!ativo && !scriptCarregado) return null
  return (
    <div {...{ vw: '' }} className="enabled">
      <div {...{ 'vw-access-button': '' }} className="active" />
      <div {...{ 'vw-plugin-wrapper': '' }}>
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  )
}
