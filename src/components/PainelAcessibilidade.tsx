'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconAccessible, IconContrast, IconHandLoveYou, IconPlayerStopFilled, IconRefresh, IconTextSize, IconVolume, IconWalk, IconX } from '@tabler/icons-react'
import {
  EVENTO_ACESSIBILIDADE,
  PADRAO,
  obterPreferencias,
  salvarPreferencias,
  type PreferenciasAcessibilidade,
  type TamanhoTexto,
} from '@/lib/acessibilidade'
import { useFocoPreso } from '@/lib/useFocoPreso'
import Portal from './Portal'

const TAMANHOS: { valor: TamanhoTexto; rotulo: string; nome: string; escala: string }[] = [
  { valor: 'normal', rotulo: 'A', nome: 'Texto normal', escala: '0.875rem' },
  { valor: 'grande', rotulo: 'A+', nome: 'Texto grande', escala: '1rem' },
  { valor: 'maior', rotulo: 'A++', nome: 'Texto maior', escala: '1.125rem' },
]

// Lê o conteúdo principal da página em voz alta, em pedaços (alguns
// navegadores cortam falas longas), com a voz em português do aparelho.
function textoParaLer(): string[] {
  const alvo = document.getElementById('conteudo') ?? document.body
  const texto = (alvo.innerText || '').replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
  const frases = texto.split(/(?<=[.!?:\n])\s+/)
  const pedacos: string[] = []
  let atual = ''
  for (const f of frases) {
    if ((atual + ' ' + f).length > 220 && atual) {
      pedacos.push(atual)
      atual = f
    } else atual = atual ? `${atual} ${f}` : f
  }
  if (atual) pedacos.push(atual)
  return pedacos
}

function Interruptor({ id, ligado, onChange, titulo, descricao, icone }: { id: string; ligado: boolean; onChange: (v: boolean) => void; titulo: string; descricao: string; icone: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <span aria-hidden style={{ color: 'var(--c-accent-text)', display: 'flex', marginTop: '0.1rem' }}>{icone}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <label htmlFor={id} style={{ display: 'block', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>{titulo}</label>
        <p id={`${id}-desc`} style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: 'var(--c-text-2)', lineHeight: 1.45 }}>{descricao}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-describedby={`${id}-desc`}
        onClick={() => onChange(!ligado)}
        style={{ flexShrink: 0, width: '46px', height: '26px', borderRadius: '9999px', border: 'none', padding: '3px', cursor: 'pointer', background: ligado ? '#1a7aff' : 'var(--c-text-4)', transition: 'background 150ms ease', display: 'flex', justifyContent: ligado ? 'flex-end' : 'flex-start' }}
      >
        <span aria-hidden style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </button>
    </div>
  )
}

// Botão "Acessibilidade" do topo e o painel com as opções: Libras, tamanho
// do texto, ouvir a página e reduzir animações.
export default function PainelAcessibilidade({ compacto = false }: { compacto?: boolean }) {
  const [aberto, setAberto] = useState(false)
  const [prefs, setPrefs] = useState<PreferenciasAcessibilidade>(PADRAO)
  const [lendo, setLendo] = useState(false)
  const [temVoz, setTemVoz] = useState(false)
  const painelRef = useRef<HTMLDivElement>(null)
  useFocoPreso(painelRef, aberto)

  useEffect(() => {
    setPrefs(obterPreferencias())
    setTemVoz('speechSynthesis' in window)
    const aoMudar = (e: Event) => setPrefs((e as CustomEvent<PreferenciasAcessibilidade>).detail)
    window.addEventListener(EVENTO_ACESSIBILIDADE, aoMudar)
    return () => {
      window.removeEventListener(EVENTO_ACESSIBILIDADE, aoMudar)
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  function mudar(m: Partial<PreferenciasAcessibilidade>) {
    setPrefs(salvarPreferencias(m))
  }

  function alternarLeitura() {
    const voz = window.speechSynthesis
    if (lendo) {
      voz.cancel()
      setLendo(false)
      return
    }
    const pedacos = textoParaLer()
    if (pedacos.length === 0) return
    voz.cancel()
    const vozPt = voz.getVoices().find((v) => v.lang.toLowerCase().startsWith('pt'))
    pedacos.forEach((texto, i) => {
      const fala = new SpeechSynthesisUtterance(texto)
      fala.lang = 'pt-BR'
      if (vozPt) fala.voice = vozPt
      if (i === pedacos.length - 1) fala.onend = () => setLendo(false)
      fala.onerror = () => setLendo(false)
      voz.speak(fala)
    })
    setLendo(true)
    setAberto(false)
  }

  const botaoTopo = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    height: '38px',
    padding: compacto ? '0' : '0 0.75rem',
    width: compacto ? '38px' : undefined,
    justifyContent: 'center',
    borderRadius: '0.75rem',
    border: '1px solid var(--c-input-border)',
    background: lendo ? 'var(--c-accent-soft)' : 'var(--c-glass-bg-sm)',
    color: lendo ? 'var(--c-accent-text)' : 'var(--c-text-1)',
    fontSize: '0.8125rem',
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    flexShrink: 0,
  } as const

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} aria-haspopup="dialog" aria-expanded={aberto} aria-label="Acessibilidade" title="Acessibilidade" style={botaoTopo}>
        <IconAccessible size={20} aria-hidden />
        {!compacto && <span className="rotulo-acessibilidade">Acessibilidade</span>}
      </button>

      {lendo && (
        <Portal>
          <button type="button" onClick={alternarLeitura} className="parar-leitura" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))', zIndex: 10030, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.1rem', borderRadius: '9999px', border: 'none', background: '#1a7aff', color: '#fff', fontWeight: 700, fontSize: '0.9375rem', fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(26,122,255,0.35)', cursor: 'pointer' }}>
            <IconPlayerStopFilled size={18} aria-hidden /> Parar leitura
          </button>
        </Portal>
      )}

      {aberto && (
        <Portal>
          <div onClick={() => setAberto(false)} style={{ position: 'fixed', inset: 0, zIndex: 10040, background: 'var(--c-overlay)' }} aria-hidden />
          <div
            ref={painelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="painel-acessibilidade-titulo"
            style={{ position: 'fixed', zIndex: 10041, top: 'calc(0.75rem + env(safe-area-inset-top, 0px))', right: '0.75rem', left: 'auto', width: 'min(380px, calc(100vw - 1.5rem))', maxHeight: 'calc(100vh - 1.5rem)', overflowY: 'auto', background: 'var(--c-modal-bg)', color: 'var(--c-text-1)', border: 'var(--c-border)', borderRadius: '1.25rem', boxShadow: 'var(--c-shadow-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <h2 id="painel-acessibilidade-titulo" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconAccessible size={22} aria-hidden style={{ color: 'var(--c-accent-text)' }} /> Acessibilidade
              </h2>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar painel de acessibilidade" style={{ background: 'none', border: 'none', color: 'var(--c-text-2)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}>
                <IconX size={22} aria-hidden />
              </button>
            </div>

            <Interruptor
              id="pref-libras"
              ligado={prefs.libras}
              onChange={(v) => mudar({ libras: v })}
              titulo="Tradução em Libras"
              descricao="Mostra o botão do VLibras no canto da tela. Toque nele e depois em um texto para ver a tradução."
              icone={<IconHandLoveYou size={22} aria-hidden />}
            />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span aria-hidden style={{ color: 'var(--c-accent-text)', display: 'flex', marginTop: '0.1rem' }}><IconTextSize size={22} aria-hidden /></span>
              <div style={{ flex: 1 }}>
                <p id="pref-texto-titulo" style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem' }}>Tamanho do texto</p>
                <div role="group" aria-labelledby="pref-texto-titulo" style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
                  {TAMANHOS.map((t) => {
                    const ativo = prefs.texto === t.valor
                    return (
                      <button key={t.valor} type="button" aria-pressed={ativo} aria-label={t.nome} onClick={() => mudar({ texto: t.valor })} style={{ flex: 1, height: '42px', borderRadius: '0.75rem', border: ativo ? '2px solid #1a7aff' : '1px solid var(--c-divider)', background: ativo ? 'var(--c-accent-soft)' : 'transparent', color: ativo ? 'var(--c-accent-text)' : 'var(--c-text-1)', fontWeight: 800, fontSize: t.escala, fontFamily: 'inherit', cursor: 'pointer' }}>
                        {t.rotulo}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {temVoz && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span aria-hidden style={{ color: 'var(--c-accent-text)', display: 'flex', marginTop: '0.1rem' }}><IconVolume size={22} aria-hidden /></span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem' }}>Ouvir esta página</p>
                  <p style={{ margin: '0.125rem 0 0.5rem', fontSize: '0.8125rem', color: 'var(--c-text-2)', lineHeight: 1.45 }}>Lê o conteúdo em voz alta com a voz do seu aparelho. Quem usa leitor de tela não precisa desta opção.</p>
                  <button type="button" onClick={alternarLeitura} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.95rem', borderRadius: '0.75rem', border: 'none', background: '#1a7aff', color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit', cursor: 'pointer' }}>
                    {lendo ? <IconPlayerStopFilled size={16} aria-hidden /> : <IconVolume size={16} aria-hidden />}
                    {lendo ? 'Parar leitura' : 'Ouvir agora'}
                  </button>
                </div>
              </div>
            )}

            <Interruptor
              id="pref-contraste"
              ligado={prefs.altoContraste}
              onChange={(v) => mudar({ altoContraste: v })}
              titulo="Alto contraste"
              descricao="Fundo preto, texto branco e destaques em amarelo, com bordas mais fortes. Para baixa visão."
              icone={<IconContrast size={22} aria-hidden />}
            />

            <Interruptor
              id="pref-movimento"
              ligado={prefs.reduzirMovimento}
              onChange={(v) => mudar({ reduzirMovimento: v })}
              titulo="Reduzir animações"
              descricao="Desliga transições e movimentos da tela."
              icone={<IconWalk size={22} aria-hidden />}
            />

            <button type="button" onClick={() => mudar(PADRAO)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', padding: 0, color: 'var(--c-text-2)', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>
              <IconRefresh size={15} aria-hidden /> Voltar ao padrão
            </button>
          </div>
        </Portal>
      )}
    </>
  )
}
