'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconDeviceFloppy, IconFileText } from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import EditorRico from '@/components/EditorRico'
import TextoRico from '@/components/TextoRico'
import { campoStyle } from '@/components/ItemEditavel'
import { api, type Termo } from '@/lib/api'

type Rascunho = { titulo: string; conteudo_html: string }

export default function TermosPage() {
  const [termos, setTermos] = useState<Termo[]>([])
  const [chave, setChave] = useState('')
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api
      .listarTermos()
      .then(({ termos: t }) => {
        setTermos(t)
        if (t[0]) {
          setChave(t[0].chave)
          setRascunho({ titulo: t[0].titulo, conteudo_html: t[0].conteudo_html })
        }
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar os termos'))
  }, [])

  const termo = useMemo(() => termos.find((t) => t.chave === chave) ?? null, [termos, chave])
  const alterado = !!termo && !!rascunho && (termo.titulo !== rascunho.titulo || termo.conteudo_html !== rascunho.conteudo_html)

  function selecionar(t: Termo) {
    if (alterado && !confirm('Há alterações não salvas neste termo. Descartar?')) return
    setChave(t.chave)
    setRascunho({ titulo: t.titulo, conteudo_html: t.conteudo_html })
    setAviso('')
    setErro('')
  }

  async function salvar() {
    if (!termo || !rascunho) return
    setSalvando(true)
    setErro('')
    setAviso('')
    try {
      const salvo = await api.salvarTermo(termo.chave, rascunho)
      setTermos((l) => l.map((t) => (t.chave === salvo.chave ? salvo : t)))
      setRascunho({ titulo: salvo.titulo, conteudo_html: salvo.conteudo_html })
      setAviso('Termo salvo. O novo texto já aparece nos formulários.')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <PaginaAdmin
      atual="/termos"
      titulo="Termos e condições"
      descricao="Textos que a pessoa precisa aceitar para criar a conta, criar uma página ou se inscrever em uma certificação. Ao salvar, o texto novo passa a valer para os próximos aceites."
      largura={1240}
    >
      <ErroBanner mensagem={erro} />
      {aviso && (
        <p role="status" style={{ margin: '0 0 1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--c-success-soft)', color: 'var(--c-success-text)', fontSize: '0.875rem', fontWeight: 600 }}>
          {aviso}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 260px) minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }} className="comunicacao-grade">
        <nav aria-label="Termos">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {termos.map((t) => (
              <li key={t.chave}>
                <button
                  type="button"
                  onClick={() => selecionar(t)}
                  aria-current={t.chave === chave ? 'true' : undefined}
                  style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: 'none', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: t.chave === chave ? 'var(--c-accent-soft)' : 'transparent', color: t.chave === chave ? 'var(--c-text-blue)' : 'var(--c-text-2)' }}
                >
                  {t.nome}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {termo && rascunho && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
            <GlassCard style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800 }}>{termo.nome}</h2>
                {termo.descricao && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>{termo.descricao}</p>}
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-input-label)' }}>Título *</span>
                <input value={rascunho.titulo} onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })} maxLength={200} style={campoStyle} />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-input-label)' }}>Texto *</span>
                <EditorRico key={termo.chave} rotulo="Texto dos termos" valor={rascunho.conteudo_html} onChange={(v) => setRascunho((r) => (r ? { ...r, conteudo_html: v } : r))} max={40000} linhas={14} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="button" onClick={salvar} disabled={!alterado || salvando || !rascunho.titulo.trim()} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, cursor: alterado ? 'pointer' : 'default', opacity: !alterado || salvando ? 0.55 : 1 }}>
                  <IconDeviceFloppy size={16} aria-hidden /> {salvando ? 'Salvando…' : 'Salvar'}
                </button>
                {alterado && <span style={{ fontSize: '0.8125rem', color: 'var(--c-warning-text)' }}>Alterações não salvas</span>}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--c-text-3)' }}>
                Última alteração: {new Date(termo.atualizado_em).toLocaleString('pt-BR')}
                {termo.atualizado_por ? ` por ${termo.atualizado_por}` : ''}
              </p>
            </GlassCard>

            <GlassCard style={{ padding: '1.25rem' }}>
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <IconFileText size={18} aria-hidden /> Prévia do modal
              </h2>
              <div style={{ padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--c-divider)', background: 'var(--c-glass-bg-sm)', maxHeight: '640px', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 800 }}>{rascunho.titulo || 'Termos e condições'}</h3>
                <div style={{ color: 'var(--c-text-2)', lineHeight: 1.65 }}>
                  <TextoRico valor={rascunho.conteudo_html} />
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </PaginaAdmin>
  )
}
