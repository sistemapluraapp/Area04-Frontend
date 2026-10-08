'use client'

import { Suspense, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'next/navigation'
import { IconArrowLeft, IconCalendarCheck, IconCheck, IconDownload, IconExternalLink, IconLock, IconMessageReport, IconPaperclip, IconRotate, IconX } from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import Carregando from '@/components/Carregando'
import { campoStyle } from '@/components/ItemEditavel'
import { ROTULO_TIPO_REQUISITO } from '@/lib/certificacoes'
import {
  ROTULO_STATUS_INSCRICAO, apiInscricoes, dataBr, tamanhoLegivel,
  type ArquivoItem, type InscricaoDetalheAdm, type RequisitoAdm, type RespostaAdm,
} from '@/lib/apiInscricoes'

const botao: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', borderRadius: '0.625rem', border: '1px solid var(--c-divider)', background: 'transparent', color: 'var(--c-text-1)', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit', cursor: 'pointer' }
const botaoAzul: CSSProperties = { ...botao, border: 'none', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff' }
const PERIODO = { manha: 'Manhã', tarde: 'Tarde' } as const

const ROTULO_RESPOSTA: Record<RespostaAdm['status'], { texto: string; cor: string }> = {
  rascunho: { texto: 'Rascunho (não enviado)', cor: 'var(--c-text-3)' },
  enviada: { texto: 'Aguardando avaliação', cor: 'var(--c-warning-text, #b45309)' },
  aprovada: { texto: 'Aprovado', cor: 'var(--c-success-text)' },
  ajustes: { texto: 'Ajuste pedido', cor: 'var(--c-danger-text)' },
}

function Resposta({ req, resp, inscricaoId, onErro }: { req: RequisitoAdm; resp: RespostaAdm | undefined; inscricaoId: string; onErro: (m: string) => void }) {
  if (!resp) return <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--c-text-3)' }}>Não respondido.</p>
  const v = resp.valor
  if (req.tipo === 'texto') return <p style={{ margin: 0, whiteSpace: 'pre-line', fontSize: '0.9375rem' }}>{v.texto || '—'}</p>
  if (req.tipo === 'link' || req.tipo === 'video')
    return v.url ? <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-accent-text)', fontWeight: 600, wordBreak: 'break-all' }}>{v.url} <IconExternalLink size={14} aria-hidden /></a> : <p style={{ margin: 0 }}>—</p>
  if (req.tipo === 'formulario')
    return (
      <dl style={{ margin: 0, display: 'grid', gap: '0.4rem' }}>
        {(req.config.campos ?? []).map((c, i) => (
          <div key={i}>
            <dt style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-3)' }}>{c.rotulo}</dt>
            <dd style={{ margin: 0, fontSize: '0.9375rem' }}>{v.respostas?.[i] === 'sim' ? 'Sim' : v.respostas?.[i] === 'nao' ? 'Não' : v.respostas?.[i] || '—'}</dd>
          </div>
        ))}
      </dl>
    )
  if (req.tipo === 'arquivo') {
    const itens = (v.itens ?? []) as ArquivoItem[]
    if (!itens.length) return <p style={{ margin: 0 }}>Nenhum arquivo.</p>
    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {itens.map((a) => (
          <li key={a.chave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <IconPaperclip size={16} aria-hidden style={{ color: 'var(--c-text-3)' }} />
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome} <span style={{ color: 'var(--c-text-3)' }}>· {tamanhoLegivel(a.tamanho)}</span></span>
            <button type="button" style={botao} onClick={() => apiInscricoes.baixarArquivo(inscricaoId, req.id, a).catch((e) => onErro(e instanceof Error ? e.message : 'Erro ao baixar'))}>
              <IconDownload size={15} aria-hidden /> Baixar
            </button>
          </li>
        ))}
      </ul>
    )
  }
  // vistoria
  const datas = (v.itens ?? []) as { data: string; periodo: 'manha' | 'tarde' }[]
  return (
    <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span><strong>Datas sugeridas:</strong> {datas.length ? datas.map((d) => `${dataBr(d.data)} (${PERIODO[d.periodo]})`).join('; ') : '—'}</span>
      <span><strong>Contato:</strong> {v.contato || '—'}</span>
      {v.observacoes && <span><strong>Observações:</strong> {v.observacoes}</span>}
      {v.confirmada && <span style={{ color: 'var(--c-success-text)', fontWeight: 700 }}>Confirmada para {dataBr(v.confirmada.data)} ({PERIODO[v.confirmada.periodo]})</span>}
    </div>
  )
}

function ConfirmarVistoria({ inscricaoId, req, resp, onSalvo, onErro }: { inscricaoId: string; req: RequisitoAdm; resp: RespostaAdm; onSalvo: (r: RespostaAdm) => void; onErro: (m: string) => void }) {
  const sugeridas = (resp.valor.itens ?? []) as { data: string; periodo: 'manha' | 'tarde' }[]
  const [data, setData] = useState(resp.valor.confirmada?.data ?? sugeridas[0]?.data ?? '')
  const [periodo, setPeriodo] = useState<'manha' | 'tarde'>(resp.valor.confirmada?.periodo ?? sugeridas[0]?.periodo ?? 'manha')
  const [salvando, setSalvando] = useState(false)
  async function confirmar() {
    setSalvando(true)
    try {
      onSalvo(await apiInscricoes.confirmarVistoria(inscricaoId, req.id, data, periodo))
    } catch (e) {
      onErro(e instanceof Error ? e.message : 'Erro ao confirmar')
    } finally {
      setSalvando(false)
    }
  }
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.625rem' }}>
      <label className="sr-only" htmlFor={`vd-${req.id}`}>Data da vistoria</label>
      <input id={`vd-${req.id}`} type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ ...campoStyle, width: 'auto' }} />
      <label className="sr-only" htmlFor={`vp-${req.id}`}>Período</label>
      <select id={`vp-${req.id}`} value={periodo} onChange={(e) => setPeriodo(e.target.value as 'manha' | 'tarde')} style={{ ...campoStyle, width: 'auto' }}>
        <option value="manha">Manhã</option>
        <option value="tarde">Tarde</option>
      </select>
      <button type="button" onClick={confirmar} disabled={!data || salvando} style={botao}>
        <IconCalendarCheck size={16} aria-hidden /> {resp.valor.confirmada ? 'Remarcar vistoria' : 'Confirmar vistoria'}
      </button>
    </div>
  )
}

function Detalhe() {
  const id = useSearchParams().get('id') ?? ''
  const [insc, setInsc] = useState<InscricaoDetalheAdm | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [comentarios, setComentarios] = useState<Record<string, string>>({})
  const [ajustando, setAjustando] = useState<string | null>(null)
  const [observacao, setObservacao] = useState('')
  const [concluindo, setConcluindo] = useState(false)

  const carregar = useCallback(() => {
    apiInscricoes.obter(id).then(setInsc).catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
  }, [id])
  useEffect(() => carregar(), [carregar])

  const respostas = useMemo(() => Object.fromEntries((insc?.respostas ?? []).map((r) => [r.requisito_id, r])), [insc])
  const liberadas = useMemo(() => new Map((insc?.etapas_liberadas ?? []).map((l) => [l.etapa_id, l.aprovada])), [insc])

  if (!insc) return erro ? <ErroBanner mensagem={erro} /> : <Carregando />

  const emAnalise = insc.status === 'enviada'
  const st = ROTULO_STATUS_INSCRICAO[insc.status]
  const pendentes = insc.respostas.filter((r) => r.status === 'enviada').length
  const ajustes = insc.respostas.filter((r) => r.status === 'ajustes').length
  const todasEtapasLiberadas = insc.etapas_liberadas.length === insc.certificacao.etapas.length
  const tudoAprovado = insc.certificacao.etapas.every((e) => e.requisitos.filter((r) => r.obrigatorio).every((r) => respostas[r.id]?.status === 'aprovada'))
  const previsao = ajustes > 0
    ? 'A inscrição volta para a página corrigir os itens com ajuste.'
    : tudoAprovado && todasEtapasLiberadas
      ? `A certificação será concedida${insc.certificacao.validade_meses ? ` por ${insc.certificacao.validade_meses} meses` : ''}.`
      : 'A próxima etapa será liberada para a página preencher.'

  async function avaliar(req: RequisitoAdm, status: 'aprovada' | 'ajustes' | 'enviada') {
    setErro('')
    try {
      const r = await apiInscricoes.avaliar(id, req.id, status, comentarios[req.id])
      setInsc((a) => a && { ...a, respostas: a.respostas.map((x) => (x.requisito_id === req.id ? { ...x, ...r } : x)) })
      setAjustando(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao avaliar')
    }
  }

  async function concluir(decisao: 'concluir' | 'reprovar') {
    if (decisao === 'reprovar' && !confirm('Reprovar esta inscrição? A página recebe o motivo e o processo é encerrado.')) return
    setConcluindo(true)
    setErro('')
    try {
      const r = await apiInscricoes.concluir(id, decisao, observacao)
      setAviso(r.status === 'aprovada' ? 'Certificação concedida. A equipe da página foi avisada.' : r.status === 'reprovada' ? 'Inscrição reprovada. A equipe da página foi avisada.' : 'Análise concluída. A equipe da página foi avisada para continuar.')
      setObservacao('')
      carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao concluir')
    } finally {
      setConcluindo(false)
    }
  }

  return (
    <>
      <a href="/certificacoes-inscricoes" style={{ ...botao, textDecoration: 'none', marginBottom: '1rem' }}><IconArrowLeft size={16} aria-hidden /> Todas as inscrições</a>
      <ErroBanner mensagem={erro} />
      {aviso && <p role="status" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--c-success-soft)', color: 'var(--c-success-text)', fontWeight: 600 }}>{aviso}</p>}

      <GlassCard style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{insc.pagina_nome}</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--c-text-2)' }}>
              {insc.pagina_tipo === 'publica' ? 'Página Gov' : 'Página B2B'}{insc.pagina_cidade ? ` · ${insc.pagina_cidade}/${insc.pagina_uf ?? ''}` : ''} · {insc.certificacao.titulo}
            </p>
          </div>
          <span style={{ alignSelf: 'flex-start', padding: '0.2rem 0.7rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 700, color: st.cor, background: st.fundo }}>{st.texto}</span>
        </div>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem', color: 'var(--c-text-3)', lineHeight: 1.6 }}>
          Inscrita em {dataBr(insc.created_at)}{insc.enviada_em ? ` · enviada em ${dataBr(insc.enviada_em)}` : ''}
          {insc.concedida_em ? ` · concedida em ${dataBr(insc.concedida_em)}` : ''}{insc.expira_em ? ` · vence em ${dataBr(insc.expira_em)}` : ''}
          {insc.analisada_por ? ` · última análise por ${insc.analisada_por}` : ''}
          <br />
          Equipe responsável: {insc.equipe.map((m) => `${m.nome ?? '—'} (${m.papel === 'administrador' ? 'dono' : m.cargo || 'colaborador'})`).join(', ') || '—'}
        </p>
        {insc.observacao_adm && <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}><strong>Observação da última análise:</strong> {insc.observacao_adm}</p>}
      </GlassCard>

      {insc.certificacao.etapas.map((etapa, i) => {
        const liberada = liberadas.has(etapa.id)
        return (
          <section key={etapa.id} style={{ marginBottom: '1.25rem' }} aria-labelledby={`et-${etapa.id}`}>
            <h3 id={`et-${etapa.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.0625rem', fontWeight: 800, margin: '0 0 0.625rem' }}>
              {!liberada && <IconLock size={18} aria-hidden />} Etapa {i + 1}: {etapa.titulo}
              {liberadas.get(etapa.id) && <span style={{ fontSize: '0.75rem', color: 'var(--c-success-text)' }}>aprovada</span>}
            </h3>
            {!liberada ? (
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--c-text-3)' }}>Ainda não liberada para a página.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {etapa.requisitos.map((req) => {
                  const resp = respostas[req.id]
                  const rs = resp ? ROTULO_RESPOSTA[resp.status] : null
                  const avaliavel = emAnalise && resp && resp.status !== 'rascunho'
                  return (
                    <GlassCard key={req.id} style={{ padding: '1rem', border: resp?.status === 'enviada' && emAnalise ? '1px solid var(--c-warning-text, #b45309)' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <strong>{req.titulo}{!req.obrigatorio && <span style={{ fontWeight: 500, color: 'var(--c-text-3)' }}> (opcional)</span>}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>{ROTULO_TIPO_REQUISITO[req.tipo].texto}</span>
                      </div>
                      <Resposta req={req} resp={resp} inscricaoId={id} onErro={setErro} />
                      {req.tipo === 'vistoria' && resp && insc.status !== 'cancelada' && insc.status !== 'reprovada' && (
                        <ConfirmarVistoria inscricaoId={id} req={req} resp={resp} onErro={setErro} onSalvo={(r) => setInsc((a) => a && { ...a, respostas: a.respostas.map((x) => (x.requisito_id === req.id ? { ...x, ...r } : x)) })} />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                        {rs && <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: rs.cor }}>{rs.texto}{resp?.avaliada_por ? ` por ${resp.avaliada_por}` : ''}</span>}
                        {avaliavel && resp.status !== 'aprovada' && (
                          <button type="button" style={{ ...botao, color: 'var(--c-success-text)' }} onClick={() => avaliar(req, 'aprovada')}><IconCheck size={15} aria-hidden /> Aprovar</button>
                        )}
                        {avaliavel && resp.status !== 'ajustes' && ajustando !== req.id && (
                          <button type="button" style={{ ...botao, color: 'var(--c-danger-text)' }} onClick={() => setAjustando(req.id)}><IconMessageReport size={15} aria-hidden /> Pedir ajuste</button>
                        )}
                        {avaliavel && resp.status !== 'enviada' && (
                          <button type="button" style={botao} onClick={() => avaliar(req, 'enviada')}><IconRotate size={15} aria-hidden /> Desfazer</button>
                        )}
                      </div>
                      {resp?.status === 'ajustes' && resp.comentario_adm && <p style={{ margin: '0.4rem 0 0', fontSize: '0.875rem', color: 'var(--c-danger-text)' }}>Pedido: {resp.comentario_adm}</p>}
                      {ajustando === req.id && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.625rem' }}>
                          <label htmlFor={`aj-${req.id}`} style={{ fontSize: '0.8125rem', fontWeight: 600 }}>O que a página precisa ajustar?</label>
                          <textarea id={`aj-${req.id}`} rows={3} maxLength={2000} value={comentarios[req.id] ?? ''} onChange={(e) => setComentarios((c) => ({ ...c, [req.id]: e.target.value }))} style={{ ...campoStyle, resize: 'vertical' }} />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" style={{ ...botao, color: 'var(--c-danger-text)' }} disabled={!comentarios[req.id]?.trim()} onClick={() => avaliar(req, 'ajustes')}>Pedir ajuste</button>
                            <button type="button" style={botao} onClick={() => setAjustando(null)}><IconX size={15} aria-hidden /> Cancelar</button>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}

      {emAnalise && (
        <GlassCard style={{ padding: '1.25rem', position: 'sticky', bottom: '0.75rem' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 800 }}>Concluir análise</h3>
          <p style={{ margin: '0 0 0.625rem', fontSize: '0.875rem', color: 'var(--c-text-2)' }}>
            {pendentes > 0 ? `Avalie ${pendentes === 1 ? 'o item restante' : `os ${pendentes} itens restantes`} para concluir.` : previsao}
          </p>
          <label htmlFor="obs-analise" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Observação para a página (obrigatória para reprovar)</label>
          <textarea id="obs-analise" rows={2} maxLength={2000} value={observacao} onChange={(e) => setObservacao(e.target.value)} style={{ ...campoStyle, width: '100%', resize: 'vertical', margin: '0.3rem 0 0.75rem' }} />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" style={{ ...botaoAzul, opacity: pendentes > 0 || concluindo ? 0.55 : 1 }} disabled={pendentes > 0 || concluindo} onClick={() => concluir('concluir')}>
              <IconCheck size={16} aria-hidden /> Concluir análise
            </button>
            <button type="button" style={{ ...botao, color: 'var(--c-danger-text)' }} disabled={!observacao.trim() || concluindo} onClick={() => concluir('reprovar')}>
              <IconX size={16} aria-hidden /> Reprovar inscrição
            </button>
          </div>
        </GlassCard>
      )}
    </>
  )
}

export default function InscricaoAdmPage() {
  return (
    <PaginaAdmin atual="/certificacoes-inscricoes" titulo="Análise da inscrição">
      <Suspense fallback={<Carregando />}>
        <Detalhe />
      </Suspense>
    </PaginaAdmin>
  )
}
