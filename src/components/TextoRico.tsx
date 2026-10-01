'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { paraHtml, sanitizarHtml } from '@/lib/textoRico'

// Exibe um texto do EditorRico (ou texto puro antigo) com o HTML higienizado.
// A higienização usa o DOM do navegador, por isso só acontece depois de montar.
export default function TextoRico({ valor, style, className }: { valor: string | null | undefined; style?: CSSProperties; className?: string }) {
  const [html, setHtml] = useState('')
  useEffect(() => setHtml(sanitizarHtml(paraHtml(valor))), [valor])
  if (!html) return null
  return <div className={`texto-rico${className ? ` ${className}` : ''}`} style={style} dangerouslySetInnerHTML={{ __html: html }} />
}
