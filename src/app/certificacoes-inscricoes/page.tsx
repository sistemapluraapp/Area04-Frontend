'use client'

import { useEffect, useState } from 'react'
import { IconBuildingStore, IconChevronRight, IconSearch } from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import Carregando from '@/components/Carregando'
import { campoStyle } from '@/components/ItemEditavel'
import { FILTROS, ROTULO_STATUS_INSCRICAO, apiInscricoes, dataBr, type FiltroInscricoes, type InscricaoResumo } from '@/lib/apiInscricoes'

function lerFiltro(): FiltroInscricoes {
  if (typeof window === 'undefined') return 'fila'
  const f = new URLSearchParams(window.location.search).get('filtro')
  return FILTROS.some((x) => x.id === f) ? (f as FiltroInscricoes) : 'fila'
}

function diasAte(iso: string | null) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

export default function InscricoesCertificacaoPage() {
  const [filtro, setFiltro] = useState<FiltroInscricoes>('fila')
  const [busca, setBusca] = useState('')
  const [lista, setLista] = useState<InscricaoResumo[] | null>(null)
  const [contagens, setContagens] = useState<Partial<Record<FiltroInscricoes, number>>>({})
  const [erro, setErro] = useState('')

  useEffect(() => setFiltro(lerFiltro()), [])

  useEffect(() => {
    setLista(null)
    const t = setTimeout(() => {
      apiInscricoes
        .listar(filtro, busca.trim())
        .then((r) => {
          setLista(r.inscricoes)
          setContagens(r.contagens)
        })
        .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
    }, busca ? 300 : 0)
    return () => clearTimeout(t)
  }, [filtro, busca])

  function trocar(f: FiltroInscricoes) {
    setFiltro(f)
    const url = new URL(window.location.href)
    url.searchParams.set('filtro', f)
    window.history.replaceState(null, '', url)
  }

  return (
    <PaginaAdmin
      atual="/certificacoes-inscricoes"
      titulo="Inscrições e análises"
      descricao="Analise as respostas enviadas pelas páginas, acompanhe as certificadas e veja quais estão vencidas ou perto de vencer."
    >
      <ErroBanner mensagem={erro} />
      <div role="tablist" aria-label="Situação das inscrições" style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {FILTROS.map((f) => {
          const ativo = f.id === filtro
          const n = contagens[f.id]
          return (
            <button
              key={f.id}
              role="tab"
              aria-selected={ativo}
              onClick={() => trocar(f.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', borderRadius: '9999px', border: ativo ? '1px solid var(--c-accent-soft-border)' : '1px solid var(--c-divider)', background: ativo ? 'var(--c-accent-soft)' : 'transparent', color: ativo ? 'var(--c-accent-text)' : 'var(--c-text-2)', fontWeight: 700, fontSize: '0.8125rem', fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {f.rotulo}
              {n !== undefined && (
                <span style={{ minWidth: '1.4rem', padding: '0 0.35rem', borderRadius: '9999px', fontSize: '0.75rem', background: f.id === 'fila' && n > 0 ? '#dc2626' : f.id === 'vencidas' && n > 0 ? 'var(--c-danger-soft)' : 'var(--c-glass-bg-sm)', color: f.id === 'fila' && n > 0 ? '#fff' : 'inherit' }}>{n}</span>
              )}
            </button>
          )
        })}
      </div>

      <label style={{ position: 'relative', display: 'block', marginBottom: '1rem', maxWidth: '420px' }}>
        <span className="sr-only">Buscar por página, cidade ou certificação</span>
        <IconSearch size={17} aria-hidden style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)' }} />
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por página, cidade ou certificação" style={{ ...campoStyle, width: '100%', paddingLeft: '2.25rem' }} />
      </label>

      {lista === null ? (
        !erro && <Carregando />
      ) : lista.length === 0 ? (
        <p style={{ color: 'var(--c-text-3)' }}>Nenhuma inscrição nesta situação.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {lista.map((i) => {
            const st = ROTULO_STATUS_INSCRICAO[i.status]
            const dias = diasAte(i.expira_em)
            return (
              <li key={i.id}>
                <a href={`/certificacoes-inscricoes/ver?id=${i.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', borderRadius: '1rem', border: 'var(--c-border)', background: 'var(--c-glass-bg)', color: 'inherit', textDecoration: 'none' }}>
                  <span aria-hidden style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, background: i.pagina_logo ? `#fff url("${i.pagina_logo}") center/cover` : 'var(--c-accent-soft)', color: 'var(--c-accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!i.pagina_logo && <IconBuildingStore size={20} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong>{i.pagina_nome}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>{i.pagina_tipo === 'publica' ? 'Gov' : 'B2B'}{i.pagina_cidade ? ` · ${i.pagina_cidade}/${i.pagina_uf ?? ''}` : ''}</span>
                      <span style={{ padding: '0.1rem 0.55rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, color: st.cor, background: st.fundo }}>{st.texto}</span>
                    </span>
                    <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--c-text-2)', marginTop: '0.2rem' }}>
                      {i.certificacao_titulo}
                      {i.status === 'enviada' && ` · enviada em ${dataBr(i.enviada_em)} · ${i.respostas_pendentes} ${i.respostas_pendentes === 1 ? 'item' : 'itens'} para avaliar`}
                      {i.status === 'aprovada' && (i.expira_em ? ` · ${dias !== null && dias < 0 ? `venceu em ${dataBr(i.expira_em)}` : `válida até ${dataBr(i.expira_em)}${dias !== null && dias <= 60 ? ` (${dias} dias)` : ''}`}` : ' · não vence')}
                      {(i.status === 'reprovada' || i.status === 'cancelada') && ` · ${dataBr(i.decidida_em)}`}
                    </span>
                  </span>
                  <IconChevronRight size={18} aria-hidden style={{ color: 'var(--c-text-3)', flexShrink: 0 }} />
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </PaginaAdmin>
  )
}
