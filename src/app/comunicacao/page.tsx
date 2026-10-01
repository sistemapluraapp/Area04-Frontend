'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { IconDeviceFloppy, IconMail, IconSend } from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import EditorRico from '@/components/EditorRico'
import TextoRico from '@/components/TextoRico'
import { campoStyle } from '@/components/ItemEditavel'
import { api, type ModeloComunicacao, type RascunhoModelo } from '@/lib/api'

const POSICOES = [
  { valor: 'topo', rotulo: 'No topo (banner/logo)' },
  { valor: 'assinatura', rotulo: 'No fim, como assinatura' },
  { valor: 'nenhuma', rotulo: 'Sem imagem' },
] as const

const ESTILOS = [
  { valor: 'botao', rotulo: 'Botão clicável' },
  { valor: 'imagem', rotulo: 'A imagem é o link' },
] as const

function paraRascunho(m: ModeloComunicacao): RascunhoModelo {
  const { assunto, titulo, corpo_html, botao_texto, imagem_url, imagem_link, imagem_posicao, acao_estilo } = m
  return { assunto, titulo, corpo_html, botao_texto, imagem_url, imagem_link, imagem_posicao, acao_estilo }
}

function Campo({ rotulo, ajuda, children }: { rotulo: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-input-label)' }}>{rotulo}</span>
      {children}
      {ajuda && <span style={{ fontSize: '0.8125rem', color: 'var(--c-input-helper)', lineHeight: 1.45 }}>{ajuda}</span>}
    </div>
  )
}

export default function ComunicacaoPage() {
  const [modelos, setModelos] = useState<ModeloComunicacao[]>([])
  const [chave, setChave] = useState<string>('')
  const [rascunho, setRascunho] = useState<RascunhoModelo | null>(null)
  const [previa, setPrevia] = useState<{ assunto: string; html: string } | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [testando, setTestando] = useState(false)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api
      .listarModelos()
      .then(({ modelos: m }) => {
        setModelos(m)
        if (m[0]) {
          setChave(m[0].chave)
          setRascunho(paraRascunho(m[0]))
        }
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar modelos'))
  }, [])

  const modelo = useMemo(() => modelos.find((m) => m.chave === chave) ?? null, [modelos, chave])
  const alterado = !!modelo && !!rascunho && JSON.stringify(paraRascunho(modelo)) !== JSON.stringify(rascunho)

  // Prévia do e-mail atualizada enquanto digita (aguarda uma pausa de 600 ms)
  useEffect(() => {
    if (!modelo || modelo.tipo !== 'email' || !rascunho) return setPrevia(null)
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => {
      api.previaModelo(modelo.chave, rascunho).then(setPrevia).catch(() => {})
    }, 600)
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current)
    }
  }, [modelo, rascunho])

  function selecionar(m: ModeloComunicacao) {
    if (alterado && !confirm('Há alterações não salvas neste modelo. Descartar?')) return
    setChave(m.chave)
    setRascunho(paraRascunho(m))
    setAviso('')
    setErro('')
  }

  const alterar = (patch: Partial<RascunhoModelo>) => setRascunho((r) => (r ? { ...r, ...patch } : r))

  async function salvar() {
    if (!modelo || !rascunho) return
    setSalvando(true)
    setErro('')
    setAviso('')
    try {
      const salvo = await api.salvarModelo(modelo.chave, rascunho)
      setModelos((l) => l.map((m) => (m.chave === salvo.chave ? salvo : m)))
      setRascunho(paraRascunho(salvo))
      setAviso('Alterações salvas. Os próximos envios já usam este texto.')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function enviarTeste() {
    if (!modelo || !rascunho) return
    setTestando(true)
    setErro('')
    setAviso('')
    try {
      const r = await api.testarModelo(modelo.chave, rascunho)
      setAviso(`E-mail de teste enviado para ${r.enviado_para}.`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar teste')
    } finally {
      setTestando(false)
    }
  }

  const grupos = [
    { titulo: 'E-mails', itens: modelos.filter((m) => m.tipo === 'email') },
    { titulo: 'Páginas de boas-vindas', itens: modelos.filter((m) => m.tipo === 'pagina') },
  ]
  const ehEmail = modelo?.tipo === 'email'

  return (
    <PaginaAdmin
      atual="/comunicacao"
      titulo="E-mails e boas-vindas"
      descricao="Textos dos e-mails enviados pela Plura (confirmação de cadastro, senha, convites) e das páginas exibidas depois que a pessoa confirma o e-mail. Use {{nome}} e {{email}} para personalizar."
      largura={1240}
    >
      <ErroBanner mensagem={erro} />
      {aviso && (
        <p role="status" style={{ margin: '0 0 1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--c-success-soft)', color: 'var(--c-success-text)', fontSize: '0.875rem', fontWeight: 600 }}>
          {aviso}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 260px) minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }} className="comunicacao-grade">
        <nav aria-label="Modelos" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {grupos.map((g) => (
            <div key={g.titulo}>
              <p style={{ margin: '0 0 0.375rem', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-text-3)' }}>{g.titulo}</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {g.itens.map((m) => (
                  <li key={m.chave}>
                    <button
                      type="button"
                      onClick={() => selecionar(m)}
                      aria-current={m.chave === chave ? 'true' : undefined}
                      style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: 'none', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: m.chave === chave ? 'var(--c-accent-soft)' : 'transparent', color: m.chave === chave ? 'var(--c-text-blue)' : 'var(--c-text-2)' }}
                    >
                      {m.nome}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {modelo && rascunho && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
            <GlassCard style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800 }}>{modelo.nome}</h2>
                {modelo.descricao && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>{modelo.descricao}</p>}
              </div>
              {ehEmail && (
                <Campo rotulo="Assunto do e-mail *">
                  <input value={rascunho.assunto ?? ''} onChange={(e) => alterar({ assunto: e.target.value })} maxLength={200} style={campoStyle} />
                </Campo>
              )}
              <Campo rotulo={ehEmail ? 'Título (boas-vindas)' : 'Título da página'}>
                <input value={rascunho.titulo ?? ''} onChange={(e) => alterar({ titulo: e.target.value })} maxLength={200} style={campoStyle} />
              </Campo>
              <Campo rotulo="Texto">
                <EditorRico key={modelo.chave} rotulo="Texto" valor={rascunho.corpo_html} onChange={(v) => alterar({ corpo_html: v })} max={8000} linhas={6} />
              </Campo>
              {modelo.chave !== 'email_codigo_verificacao' && (
                <Campo rotulo="Texto do botão" ajuda={ehEmail ? 'Botão que leva ao link de confirmação/acesso.' : 'Botão que leva para a tela de entrar.'}>
                  <input value={rascunho.botao_texto ?? ''} onChange={(e) => alterar({ botao_texto: e.target.value })} maxLength={80} style={campoStyle} />
                </Campo>
              )}
              <Campo rotulo="Imagem (endereço https)" ajuda="Logo, banner ou assinatura. Deixe vazio para usar o logo da Plura.">
                <input value={rascunho.imagem_url ?? ''} onChange={(e) => alterar({ imagem_url: e.target.value })} placeholder="https://…/imagem.png" inputMode="url" style={campoStyle} />
              </Campo>
              {ehEmail && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                    <Campo rotulo="Posição da imagem">
                      <select value={rascunho.imagem_posicao} onChange={(e) => alterar({ imagem_posicao: e.target.value as RascunhoModelo['imagem_posicao'] })} style={campoStyle}>
                        {POSICOES.map((p) => (
                          <option key={p.valor} value={p.valor}>
                            {p.rotulo}
                          </option>
                        ))}
                      </select>
                    </Campo>
                    {modelo.chave !== 'email_codigo_verificacao' && (
                      <Campo rotulo="Ação principal como">
                        <select value={rascunho.acao_estilo} onChange={(e) => alterar({ acao_estilo: e.target.value as RascunhoModelo['acao_estilo'] })} style={campoStyle}>
                          {ESTILOS.map((p) => (
                            <option key={p.valor} value={p.valor}>
                              {p.rotulo}
                            </option>
                          ))}
                        </select>
                      </Campo>
                    )}
                  </div>
                  {rascunho.acao_estilo === 'botao' && (
                    <Campo rotulo="Link ao clicar na imagem (opcional)">
                      <input value={rascunho.imagem_link ?? ''} onChange={(e) => alterar({ imagem_link: e.target.value })} placeholder="https://plura.app.br" inputMode="url" style={campoStyle} />
                    </Campo>
                  )}
                </>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="button" onClick={salvar} disabled={!alterado || salvando} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700, cursor: alterado ? 'pointer' : 'default', opacity: !alterado || salvando ? 0.55 : 1 }}>
                  <IconDeviceFloppy size={16} aria-hidden /> {salvando ? 'Salvando…' : 'Salvar'}
                </button>
                {ehEmail && (
                  <button type="button" onClick={enviarTeste} disabled={testando} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>
                    <IconSend size={16} aria-hidden /> {testando ? 'Enviando…' : 'Enviar teste para meu e-mail'}
                  </button>
                )}
                {alterado && <span style={{ fontSize: '0.8125rem', color: 'var(--c-warning-text)' }}>Alterações não salvas</span>}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--c-text-3)' }}>
                Última alteração: {new Date(modelo.atualizado_em).toLocaleString('pt-BR')}
                {modelo.atualizado_por ? ` por ${modelo.atualizado_por}` : ''}
              </p>
            </GlassCard>

            <GlassCard style={{ padding: '1.25rem' }}>
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <IconMail size={18} aria-hidden /> Prévia
              </h2>
              {ehEmail ? (
                previa ? (
                  <>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>
                      <strong>Assunto:</strong> {previa.assunto}
                    </p>
                    <iframe title="Prévia do e-mail" srcDoc={previa.html} sandbox="" style={{ width: '100%', height: '640px', border: '1px solid var(--c-divider)', borderRadius: '0.75rem', background: '#f2f4f7' }} />
                  </>
                ) : (
                  <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>gerando prévia…</p>
                )
              ) : (
                <div style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--c-divider)', background: 'var(--c-glass-bg-sm)' }}>
                  <div aria-hidden style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem', borderRadius: '50%', background: 'var(--c-success-soft)', color: 'var(--c-success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>✓</div>
                  <h3 style={{ textAlign: 'center', margin: '0 0 0.75rem', fontSize: '1.375rem', fontWeight: 800 }}>{rascunho.titulo}</h3>
                  <div style={{ color: 'var(--c-text-2)' }}>
                    <TextoRico valor={rascunho.corpo_html} />
                  </div>
                  <div style={{ marginTop: '1rem', textAlign: 'center', padding: '0.75rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', fontWeight: 700 }}>{rascunho.botao_texto || 'Entrar'}</div>
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </PaginaAdmin>
  )
}
