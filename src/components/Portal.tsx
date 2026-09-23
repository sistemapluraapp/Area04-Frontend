'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Renderiza modais direto no <body>. Sem isso, um modal aberto dentro de um
// contêiner com z-index próprio (ex.: o <main> das páginas) fica preso
// atrás do cabeçalho e da barra de navegação, mesmo com z-index alto.
export default function Portal({ children }: { children: ReactNode }) {
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  return montado ? createPortal(children, document.body) : null
}
