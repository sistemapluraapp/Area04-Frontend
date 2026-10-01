'use client'

import { useEffect } from 'react'

// Título da aba do navegador no padrão "Seção · Plura"
export function useTituloPagina(titulo: string | null | undefined) {
  useEffect(() => {
    if (titulo) document.title = `${titulo} · Plura`
  }, [titulo])
}
