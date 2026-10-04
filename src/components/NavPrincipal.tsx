'use client'

import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { IconArrowLeft, IconCalendarEvent, IconHome, IconUserCircle } from '@tabler/icons-react'

// Menu principal, igual nas 4 áreas: Voltar, Início (busca em plura.app.br),
// Minha área, Agenda e Notificações. Em telas largas fica no topo com ícone
// e texto; em telas estreitas vira uma linha própria com o texto embaixo do
// ícone (classes .nav-principal e .nav-item no globals.css).

type Destino = string | (() => string)

function resolver(destino: Destino) {
  return typeof destino === 'function' ? destino() : destino
}

export default function NavPrincipal({
  inicio,
  minhaArea,
  agenda,
  voltarPara,
  notificacoes,
  className,
}: {
  // Função quando o link leva a sessão junto (montado na hora do clique)
  inicio: Destino
  minhaArea: Destino
  agenda: Destino
  // Para onde "Voltar" leva quando não há página anterior
  voltarPara: string
  notificacoes?: ReactNode
  className?: string
}) {
  const caminho = usePathname()
  // Os links com sessão só são montados no navegador (localStorage)
  const [hrefs, setHrefs] = useState({ inicio: '', minhaArea: '', agenda: '' })
  useEffect(() => {
    setHrefs({ inicio: resolver(inicio), minhaArea: resolver(minhaArea), agenda: resolver(agenda) })
  }, [inicio, minhaArea, agenda])

  function voltar() {
    const veioDaqui = document.referrer && new URL(document.referrer).origin === window.location.origin
    if (veioDaqui && window.history.length > 1) window.history.back()
    else window.location.href = voltarPara
  }

  // Monta o link de novo no clique: o token pode ter sido renovado
  const ir = (destino: Destino) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (typeof destino !== 'function' || e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    window.location.href = destino()
  }

  const atual = (href: string) => (href && !href.startsWith('http') && href.split(/[?#]/)[0] === caminho ? 'page' : undefined)

  return (
    <nav aria-label="Navegação principal" className={`nav-principal${className ? ` ${className}` : ''}`}>
      <button type="button" className="nav-item" onClick={voltar} title="Voltar para a tela anterior">
        <IconArrowLeft size={20} stroke={1.8} aria-hidden />
        <span className="nav-rotulo">Voltar</span>
      </button>
      <a className="nav-item" href={hrefs.inicio || '#'} onClick={ir(inicio)} aria-current={atual(hrefs.inicio)} title="Início: buscar lugares na Plura">
        <IconHome size={20} stroke={1.8} aria-hidden />
        <span className="nav-rotulo">Início</span>
      </a>
      <a className="nav-item" href={hrefs.minhaArea || '#'} onClick={ir(minhaArea)} aria-current={atual(hrefs.minhaArea)} title="Minha área">
        <IconUserCircle size={20} stroke={1.8} aria-hidden />
        <span className="nav-rotulo">Minha área</span>
      </a>
      <a className="nav-item" href={hrefs.agenda || '#'} onClick={ir(agenda)} aria-current={atual(hrefs.agenda)} title="Agenda de eventos">
        <IconCalendarEvent size={20} stroke={1.8} aria-hidden />
        <span className="nav-rotulo">Agenda</span>
      </a>
      {notificacoes}
    </nav>
  )
}
