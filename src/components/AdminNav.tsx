'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  IconAccessible,
  IconAlertTriangle,
  IconBuildingBank,
  IconCertificate,
  IconChartBar,
  IconFlag,
  IconHeartHandshake,
  IconLogout,
  IconMenu2,
  IconMessageCircle,
  IconServer,
  IconTags,
  IconUsers,
  IconX,
  type Icon,
} from '@tabler/icons-react'
import { limparSessao, obterUsuarioSalvo, estaLogado } from '@/lib/auth'
import { LOGO_DATA_URI } from '@/lib/logo'
import NotificationBell from './NotificationBell'
import ModoToggle from './ModoToggle'
import PainelAcessibilidade from './PainelAcessibilidade'

type Link = { href: string; label: string; Icone: Icon }

// Itens agrupados por assunto, na ordem em que o admin costuma trabalhar.
const GRUPOS: { titulo: string; links: Link[] }[] = [
  {
    titulo: 'Visão geral',
    links: [
      { href: '/dashboard', label: 'Indicadores', Icone: IconChartBar },
      { href: '/infraestrutura', label: 'Consumo de recursos em infraestrutura', Icone: IconServer },
    ],
  },
  {
    titulo: 'Moderação',
    links: [
      { href: '/comentarios', label: 'Comentários', Icone: IconMessageCircle },
      { href: '/denuncias', label: 'Denúncias', Icone: IconFlag },
      { href: '/moderacao', label: 'Avaliações sinalizadas', Icone: IconAlertTriangle },
      { href: '/certificados', label: 'Certificados', Icone: IconCertificate },
    ],
  },
  {
    titulo: 'Contas e acessos',
    links: [
      { href: '/contas', label: 'Contas', Icone: IconUsers },
      { href: '/convites-gov', label: 'Convites Gov', Icone: IconBuildingBank },
    ],
  },
  {
    titulo: 'Configurações',
    links: [
      { href: '/acessibilidade', label: 'Acessibilidade', Icone: IconAccessible },
      { href: '/catalogo', label: 'Catálogo', Icone: IconTags },
      { href: '/filtros', label: 'Necessidades', Icone: IconHeartHandshake },
    ],
  },
]

export function useRequireAuth() {
  const router = useRouter()
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    if (!estaLogado()) {
      router.replace('/login')
      return
    }
    setPronto(true)
  }, [router])

  return pronto
}

function iniciais(texto: string) {
  const partes = texto.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || 'A'
}

function Logo() {
  return (
    <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', color: 'var(--c-text-1)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_DATA_URI} alt="Plura" style={{ height: '26px', width: 'auto' }} draggable={false} />
      <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-text-3)' }}>Admin</span>
    </a>
  )
}

export default function AdminNav({ atual }: { atual: string }) {
  const router = useRouter()
  const usuario = obterUsuarioSalvo()
  const [menuAberto, setMenuAberto] = useState(false)
  const nomeUsuario = usuario?.nome ?? usuario?.email ?? ''

  useEffect(() => {
    if (!menuAberto) return
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAberto(false)
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [menuAberto])

  function sair() {
    limparSessao()
    router.push('/login')
  }

  return (
    <>
      {menuAberto && <div className="admin-overlay" onClick={() => setMenuAberto(false)} aria-hidden />}

      <aside id="admin-menu" className="admin-sidebar" data-aberto={menuAberto} aria-label="Menu da administração">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.25rem 1rem' }}>
          <Logo />
          <button type="button" className="admin-menu-btn" onClick={() => setMenuAberto(false)} aria-label="Fechar menu">
            <IconX size={20} aria-hidden />
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo}>
              <p style={{ margin: '0 0 0.375rem', padding: '0 0.625rem', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-text-3)' }}>
                {grupo.titulo}
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {grupo.links.map(({ href, label, Icone }) => {
                  const ativo = atual === href
                  return (
                    <li key={href}>
                      <a href={href} className="admin-link" data-ativo={ativo} aria-current={ativo ? 'page' : undefined}>
                        <Icone size={18} stroke={1.8} aria-hidden style={{ flexShrink: 0 }} />
                        <span>{label}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--c-divider)',
          background: 'var(--c-topbar-bg)',
          backdropFilter: 'blur(12px)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <button type="button" className="admin-menu-btn" onClick={() => setMenuAberto(true)} aria-label="Abrir menu" aria-expanded={menuAberto} aria-controls="admin-menu">
            <IconMenu2 size={20} aria-hidden />
          </button>
          <span className="admin-logo-topo">
            <Logo />
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <PainelAcessibilidade />
          <ModoToggle />
          <NotificationBell />
          {usuario && (
            <span title={nomeUsuario} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.625rem', marginLeft: '0.125rem', borderLeft: '1px solid var(--c-divider)' }}>
              <span aria-hidden style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--c-accent-soft)', color: 'var(--c-accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                {iniciais(nomeUsuario)}
              </span>
              <span className="admin-nome-usuario" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-2)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nomeUsuario}
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={sair}
            aria-label="Sair"
            title="Sair"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: '1px solid var(--c-divider)', borderRadius: '0.75rem', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit', color: 'var(--c-text-2)', cursor: 'pointer' }}
          >
            <IconLogout size={16} aria-hidden /> <span className="admin-nome-usuario">Sair</span>
          </button>
        </div>
      </header>
    </>
  )
}
