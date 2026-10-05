'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { IconArrowDown, IconArrowUp, IconCheck, IconH2, IconLink, IconPhoto, IconTextCaption, IconTrash, type Icon } from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import EditorRico from '@/components/EditorRico'
import Carregando from '@/components/Carregando'
import { campoStyle } from '@/components/ItemEditavel'
import { api, type BlocoPaginaCertificacoes, type PaginaCertificacoes } from '@/lib/api'

const TIPOS: { tipo: BlocoPaginaCertificacoes['tipo']; rotulo: string; Icone: Icon }[] = [
  { tipo: 'titulo', rotulo: 'Título', Icone: IconH2 },
  { tipo: 'texto', rotulo: 'Texto', Icone: IconTextCaption },
  { tipo: 'imagem', rotulo: 'Imagem', Icone: IconPhoto },
  { tipo: 'link', rotulo: 'Link', Icone: IconLink },
]

const botaoAzul: CSSProperties = { ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }
const botaoLinha: CSSProperties = { ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'transparent', fontWeight: 600, cursor: 'pointer' }
const botaoIcone: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid var(--c-divider)', background: 'none', color: 'var(--c-text-2)', cursor: 'pointer' }
const rotulo: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-2)' }

function blocoVazio(tipo: BlocoPaginaCertificacoes['tipo']): BlocoPaginaCertificacoes {
  if (tipo === 'titulo') return { tipo, texto: '' }
  if (tipo === 'texto') return { tipo, html: '' }
  if (tipo === 'imagem') return { tipo, url: '', alt: '' }
  return { tipo, url: '', texto: '' }
}

export default function PaginaCertificacoesAdmin() {
  const [pagina, setPagina] = useState<PaginaCertificacoes | null>(null)
  const [original, setOriginal] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)
  // Chave por bloco para o editor de texto não trocar de conteúdo ao reordenar
  const [chaves, setChaves] = useState<number[]>([])
  const [proxima, setProxima] = useState(0)

  useEffect(() => {
    api
      .obterPaginaCertificacoes()
      .then((p) => {
        setPagina(p)
        setOriginal(JSON.stringify(p))
        setChaves(p.blocos.map((_, i) => i))
        setProxima(p.blocos.length)
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
  }, [])

  if (!pagina) {
    return (
      <PaginaAdmin atual="/certificacoes-pagina" titulo="Página de certificações">
        <ErroBanner mensagem={erro} />
        {!erro && <Carregando />}
      </PaginaAdmin>
    )
  }

  const alterado = JSON.stringify(pagina) !== original
  const mudar = (patch: Partial<PaginaCertificacoes>) => {
    setOk(false)
    setPagina({ ...pagina, ...patch })
  }
  const mudarBloco = (i: number, patch: Partial<BlocoPaginaCertificacoes>) => mudar({ blocos: pagina.blocos.map((b, j) => (j === i ? { ...b, ...patch } : b)) })
  function moverBloco(de: number, para: number) {
    if (para < 0 || para >= pagina!.blocos.length) return
    const blocos = [...pagina!.blocos]
    const ks = [...chaves]
    ;[blocos[de], blocos[para]] = [blocos[para], blocos[de]]
    ;[ks[de], ks[para]] = [ks[para], ks[de]]
    setChaves(ks)
    mudar({ blocos })
  }
  function adicionar(tipo: BlocoPaginaCertificacoes['tipo']) {
    setChaves([...chaves, proxima])
    setProxima(proxima + 1)
    mudar({ blocos: [...pagina!.blocos, blocoVazio(tipo)] })
  }
  function remover(i: number) {
    setChaves(chaves.filter((_, j) => j !== i))
    mudar({ blocos: pagina!.blocos.filter((_, j) => j !== i) })
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    try {
      const salva = await api.salvarPaginaCertificacoes({ titulo: pagina!.titulo, subtitulo: pagina!.subtitulo, blocos: pagina!.blocos })
      setPagina(salva)
      setOriginal(JSON.stringify(salva))
      setOk(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <PaginaAdmin
      atual="/certificacoes-pagina"
      titulo="Página de certificações"
      descricao="Textos, imagens e links que aparecem no topo da página “Buscar certificações”, nas áreas de empresas e Gov, antes da lista de certificações publicadas."
    >
      <ErroBanner mensagem={erro} />

      <GlassCard style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={rotulo}>
          Título da página
          <input value={pagina.titulo} onChange={(e) => mudar({ titulo: e.target.value })} maxLength={120} style={{ ...campoStyle, fontWeight: 700 }} />
        </label>
        <label style={rotulo}>
          Subtítulo
          <input value={pagina.subtitulo ?? ''} onChange={(e) => mudar({ subtitulo: e.target.value || null })} maxLength={300} style={campoStyle} />
        </label>
      </GlassCard>

      <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 0.75rem' }}>Blocos de conteúdo</h2>
      {pagina.blocos.length === 0 && <p style={{ color: 'var(--c-text-3)', fontSize: '0.875rem' }}>Nenhum bloco ainda. Use os botões abaixo para montar a página.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {pagina.blocos.map((b, i) => {
          const tipo = TIPOS.find((t) => t.tipo === b.tipo)!
          return (
            <GlassCard key={chaves[i]} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <tipo.Icone size={18} aria-hidden style={{ color: 'var(--c-accent-text)' }} />
                <strong style={{ flex: 1, fontSize: '0.875rem' }}>Bloco {i + 1}: {tipo.rotulo}</strong>
                <button type="button" onClick={() => moverBloco(i, i - 1)} disabled={i === 0} aria-label="Subir bloco" style={{ ...botaoIcone, opacity: i === 0 ? 0.4 : 1 }}><IconArrowUp size={15} aria-hidden /></button>
                <button type="button" onClick={() => moverBloco(i, i + 1)} disabled={i === pagina.blocos.length - 1} aria-label="Descer bloco" style={{ ...botaoIcone, opacity: i === pagina.blocos.length - 1 ? 0.4 : 1 }}><IconArrowDown size={15} aria-hidden /></button>
                <button type="button" onClick={() => remover(i)} aria-label={`Remover bloco ${i + 1}`} style={{ ...botaoIcone, color: 'var(--c-danger-text)' }}><IconTrash size={15} aria-hidden /></button>
              </div>
              {b.tipo === 'titulo' && <input value={b.texto ?? ''} onChange={(e) => mudarBloco(i, { texto: e.target.value })} maxLength={160} placeholder="Ex.: Como funciona" aria-label={`Texto do título do bloco ${i + 1}`} style={{ ...campoStyle, fontWeight: 700 }} />}
              {b.tipo === 'texto' && <EditorRico valor={b.html ?? ''} onChange={(html) => mudarBloco(i, { html })} rotulo={`Texto do bloco ${i + 1}`} linhas={4} max={20000} />}
              {b.tipo === 'imagem' && (
                <>
                  <input value={b.url ?? ''} onChange={(e) => mudarBloco(i, { url: e.target.value })} placeholder="Endereço da imagem (https://...)" aria-label={`Endereço da imagem do bloco ${i + 1}`} style={campoStyle} />
                  <input value={b.alt ?? ''} onChange={(e) => mudarBloco(i, { alt: e.target.value })} maxLength={300} placeholder="Descrição da imagem para quem usa leitor de tela (obrigatória)" aria-label={`Descrição da imagem do bloco ${i + 1}`} style={campoStyle} />
                  {/^https:\/\//i.test(b.url ?? '') && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.url ?? ''} alt={b.alt ?? ''} style={{ maxWidth: '320px', maxHeight: '160px', objectFit: 'cover', borderRadius: '0.75rem', border: '1px solid var(--c-divider)' }} />
                  )}
                </>
              )}
              {b.tipo === 'link' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input value={b.texto ?? ''} onChange={(e) => mudarBloco(i, { texto: e.target.value })} maxLength={120} placeholder="Texto do link (ex.: Leia o regulamento)" aria-label={`Texto do link do bloco ${i + 1}`} style={{ ...campoStyle, flex: '1 1 200px' }} />
                  <input value={b.url ?? ''} onChange={(e) => mudarBloco(i, { url: e.target.value })} placeholder="https://..." aria-label={`Endereço do link do bloco ${i + 1}`} style={{ ...campoStyle, flex: '2 1 260px' }} />
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {TIPOS.map((t) => (
          <button key={t.tipo} type="button" onClick={() => adicionar(t.tipo)} disabled={pagina.blocos.length >= 30} style={botaoLinha}>
            <t.Icone size={16} aria-hidden /> Adicionar {t.rotulo.toLowerCase()}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', position: 'sticky', bottom: '0.75rem', padding: '0.75rem', borderRadius: '0.875rem', background: 'var(--c-modal-bg, var(--c-glass-bg-lg))', border: '1px solid var(--c-divider)' }}>
        <button type="button" onClick={salvar} disabled={salvando || !alterado || !pagina.titulo.trim()} style={{ ...botaoAzul, opacity: salvando || !alterado ? 0.6 : 1 }}>
          <IconCheck size={16} aria-hidden /> {salvando ? 'Salvando…' : 'Salvar página'}
        </button>
        <span role="status" style={{ fontSize: '0.8125rem', fontWeight: 600, color: alterado ? 'var(--c-text-1)' : ok ? 'var(--c-success-text)' : 'var(--c-text-3)' }}>
          {alterado ? 'Há alterações não salvas.' : ok ? 'Página salva.' : pagina.atualizado_por ? `Última alteração por ${pagina.atualizado_por}.` : ''}
        </span>
      </div>
    </PaginaAdmin>
  )
}
