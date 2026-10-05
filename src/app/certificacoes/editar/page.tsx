'use client'

import { Suspense, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  IconAlignLeft,
  IconArchive,
  IconArrowDown,
  IconArrowLeft,
  IconArrowUp,
  IconCalendarEvent,
  IconCheck,
  IconFileUpload,
  IconForms,
  IconLink,
  IconPlus,
  IconTrash,
  IconVideo,
  IconWorldUpload,
  type Icon,
} from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import IconePicker from '@/components/IconePicker'
import EditorRico from '@/components/EditorRico'
import Carregando from '@/components/Carregando'
import SeletorLocalidade, { type Localidade } from '@/components/SeletorLocalidade'
import { campoStyle } from '@/components/ItemEditavel'
import {
  api,
  type CampoFormulario,
  type Certificacao,
  type CertificacaoEditavel,
  type EtapaCertificacao,
  type RequisitoCertificacao,
  type TipoCampoFormulario,
  type TipoRequisito,
} from '@/lib/api'
import { buscarLocalidade } from '@/lib/localidades'
import { ROTULO_ESCOPO, ROTULO_STATUS, ROTULO_TIPO_CAMPO, ROTULO_TIPO_REQUISITO } from '@/lib/certificacoes'

const ICONE_TIPO: Record<TipoRequisito, Icon> = {
  arquivo: IconFileUpload,
  texto: IconAlignLeft,
  formulario: IconForms,
  link: IconLink,
  video: IconVideo,
  vistoria: IconCalendarEvent,
}

const botaoAzul: CSSProperties = { ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'linear-gradient(135deg,#1a7aff,#0062e6)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }
const botaoLinha: CSSProperties = { ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'transparent', fontWeight: 600, cursor: 'pointer' }
const botaoIcone: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '1px solid var(--c-divider)', background: 'none', color: 'var(--c-text-2)', cursor: 'pointer' }
const rotulo: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-2)' }
const ajuda: CSSProperties = { fontSize: '0.75rem', fontWeight: 400, color: 'var(--c-text-3)' }

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <GlassCard style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>{titulo}</h2>
        {descricao && <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-2)', margin: '0.25rem 0 0', lineHeight: 1.5 }}>{descricao}</p>}
      </div>
      {children}
    </GlassCard>
  )
}

function mover<T>(lista: T[], de: number, para: number): T[] {
  if (para < 0 || para >= lista.length) return lista
  const copia = [...lista]
  const [item] = copia.splice(de, 1)
  copia.splice(para, 0, item)
  return copia
}

// ---------- Dados gerais ----------

function DadosGerais({ cert, onSalvo }: { cert: Certificacao; onSalvo: (c: Certificacao) => void }) {
  const [form, setForm] = useState({
    titulo: cert.titulo,
    resumo: cert.resumo ?? '',
    descricao: cert.descricao ?? '',
    imagem_url: cert.imagem_url ?? '',
    icone: cert.icone,
    escopo: cert.escopo,
    validade: cert.validade_meses ? String(cert.validade_meses) : '',
  })
  const [local, setLocal] = useState<Localidade>({ pais: cert.pais, uf: cert.uf, cidade: cert.cidade })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const alterar = (patch: Partial<typeof form>) => {
    setOk(false)
    setForm((f) => ({ ...f, ...patch }))
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    setOk(false)
    try {
      const body: CertificacaoEditavel = {
        titulo: form.titulo,
        resumo: form.resumo || null,
        descricao: form.descricao || null,
        imagem_url: form.imagem_url.trim() || null,
        icone: form.icone,
        escopo: form.escopo,
        pais: local.pais || 'BR',
        uf: local.uf || null,
        cidade: local.uf ? local.cidade || null : null,
        validade_meses: form.validade ? Number(form.validade) : null,
      }
      onSalvo(await api.atualizarCertificacao(cert.id, body))
      setOk(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Secao titulo="Dados gerais" descricao="O que aparece para empresas e órgãos públicos na página de certificações.">
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={rotulo}>
          Ícone
          <IconePicker valor={form.icone} onChange={(icone) => alterar({ icone })} rotulo="Ícone da certificação" />
        </div>
        <label style={{ ...rotulo, flex: '1 1 280px' }}>
          Título
          <input value={form.titulo} onChange={(e) => alterar({ titulo: e.target.value })} maxLength={120} style={campoStyle} />
        </label>
      </div>
      <label style={rotulo}>
        Resumo <span style={ajuda}>Uma ou duas frases, mostradas no card da busca ({form.resumo.length}/300).</span>
        <textarea value={form.resumo} onChange={(e) => alterar({ resumo: e.target.value })} maxLength={300} rows={2} style={{ ...campoStyle, resize: 'vertical', fontFamily: 'inherit' }} />
      </label>
      <EditorRico valor={form.descricao} onChange={(descricao) => alterar({ descricao })} rotulo="Descrição completa (benefícios, para quem é, como funciona)" linhas={6} max={20000} />
      <label style={rotulo}>
        Imagem de capa <span style={ajuda}>Endereço https:// de uma imagem já publicada (opcional).</span>
        <input value={form.imagem_url} onChange={(e) => alterar({ imagem_url: e.target.value })} placeholder="https://..." style={campoStyle} />
      </label>
      {/^https:\/\//i.test(form.imagem_url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={form.imagem_url} alt="Prévia da imagem de capa" style={{ maxWidth: '320px', maxHeight: '160px', objectFit: 'cover', borderRadius: '0.75rem', border: '1px solid var(--c-divider)' }} />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.875rem' }}>
        <label style={rotulo}>
          Quem pode se inscrever
          <select value={form.escopo} onChange={(e) => alterar({ escopo: e.target.value as Certificacao['escopo'] })} style={campoStyle}>
            {(Object.keys(ROTULO_ESCOPO) as Certificacao['escopo'][]).map((k) => (
              <option key={k} value={k}>{ROTULO_ESCOPO[k]}</option>
            ))}
          </select>
        </label>
        <label style={rotulo}>
          Validade depois de concedida <span style={ajuda}>Em meses. Vazio = não vence.</span>
          <input type="number" min={1} max={120} value={form.validade} onChange={(e) => alterar({ validade: e.target.value })} placeholder="Ex.: 24" style={campoStyle} />
        </label>
        <div style={rotulo}>
          Pagamento
          <span style={{ ...campoStyle, color: 'var(--c-text-2)', fontWeight: 400 }}>Gratuita (cobrança pelo Mercado Pago virá depois)</span>
        </div>
      </div>
      <div style={rotulo}>
        Região onde vale <span style={ajuda}>Deixe estado e cidade em branco para valer no país inteiro; só o estado para valer no estado todo.</span>
        <SeletorLocalidade valor={local} onChange={(l) => { setOk(false); setLocal(l) }} buscar={buscarLocalidade} estiloCampo={{ ...campoStyle, width: '100%' }} />
      </div>
      {erro && <p role="alert" style={{ margin: 0, color: 'var(--c-danger-text)', fontSize: '0.875rem' }}>{erro}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button type="button" onClick={salvar} disabled={salvando || !form.titulo.trim()} style={{ ...botaoAzul, opacity: salvando ? 0.6 : 1 }}>
          <IconCheck size={16} aria-hidden /> {salvando ? 'Salvando…' : 'Salvar dados gerais'}
        </button>
        {ok && <span role="status" style={{ color: 'var(--c-success-text)', fontSize: '0.875rem', fontWeight: 600 }}>Dados salvos.</span>}
      </div>
    </Secao>
  )
}

// ---------- Etapas e requisitos ----------

function novoRequisito(tipo: TipoRequisito = 'arquivo'): RequisitoCertificacao {
  return { titulo: '', descricao: null, tipo, obrigatorio: true, config: tipo === 'formulario' ? { campos: [{ rotulo: '', tipo: 'texto_curto', obrigatorio: true }] } : tipo === 'arquivo' ? { max_arquivos: 1 } : {} }
}

function EditorFormulario({ campos, onChange }: { campos: CampoFormulario[]; onChange: (c: CampoFormulario[]) => void }) {
  const alterar = (i: number, patch: Partial<CampoFormulario>) => onChange(campos.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--c-glass-bg-sm)' }}>
      <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Perguntas do formulário</span>
      {campos.map((campo, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={campo.rotulo} onChange={(e) => alterar(i, { rotulo: e.target.value })} maxLength={120} placeholder={`Pergunta ${i + 1}`} aria-label={`Pergunta ${i + 1}`} style={{ ...campoStyle, flex: '2 1 220px' }} />
          <select value={campo.tipo} onChange={(e) => alterar(i, { tipo: e.target.value as TipoCampoFormulario, opcoes: e.target.value === 'opcoes' ? campo.opcoes ?? ['', ''] : undefined })} aria-label={`Tipo de resposta da pergunta ${i + 1}`} style={{ ...campoStyle, flex: '1 1 160px' }}>
            {(Object.keys(ROTULO_TIPO_CAMPO) as TipoCampoFormulario[]).map((t) => <option key={t} value={t}>{ROTULO_TIPO_CAMPO[t]}</option>)}
          </select>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8125rem' }}>
            <input type="checkbox" checked={campo.obrigatorio} onChange={(e) => alterar(i, { obrigatorio: e.target.checked })} /> Obrigatória
          </label>
          <button type="button" onClick={() => onChange(campos.filter((_, j) => j !== i))} disabled={campos.length === 1} aria-label={`Remover pergunta ${i + 1}`} style={{ ...botaoIcone, color: 'var(--c-danger-text)', opacity: campos.length === 1 ? 0.4 : 1 }}>
            <IconTrash size={15} aria-hidden />
          </button>
          {campo.tipo === 'opcoes' && (
            <input
              value={(campo.opcoes ?? []).join('; ')}
              onChange={(e) => alterar(i, { opcoes: e.target.value.split(';').map((o) => o.trimStart()) })}
              placeholder="Opções separadas por ponto e vírgula. Ex.: Sim, totalmente; Em parte; Não"
              aria-label={`Opções da pergunta ${i + 1}`}
              style={{ ...campoStyle, flex: '1 1 100%' }}
            />
          )}
        </div>
      ))}
      <div>
        <button type="button" onClick={() => onChange([...campos, { rotulo: '', tipo: 'texto_curto', obrigatorio: true }])} disabled={campos.length >= 30} style={botaoLinha}>
          <IconPlus size={15} aria-hidden /> Adicionar pergunta
        </button>
      </div>
    </div>
  )
}

function EditorRequisito({
  req,
  indice,
  total,
  etapas,
  etapaAtual,
  onChange,
  onMover,
  onMoverEtapa,
  onRemover,
}: {
  req: RequisitoCertificacao
  indice: number
  total: number
  etapas: EtapaCertificacao[]
  etapaAtual: number
  onChange: (r: RequisitoCertificacao) => void
  onMover: (para: number) => void
  onMoverEtapa: (etapa: number) => void
  onRemover: () => void
}) {
  const IconeTipo = ICONE_TIPO[req.tipo]
  const mudarTipo = (tipo: TipoRequisito) => onChange({ ...novoRequisito(tipo), id: req.id, titulo: req.titulo, descricao: req.descricao, obrigatorio: req.obrigatorio })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: '0.875rem', borderRadius: '0.875rem', border: '1px solid var(--c-divider)', background: 'var(--c-glass-bg)' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span aria-hidden style={{ display: 'flex', color: 'var(--c-accent-text)' }}><IconeTipo size={20} /></span>
        <input value={req.titulo} onChange={(e) => onChange({ ...req, titulo: e.target.value })} maxLength={160} placeholder="Título do requisito (ex.: Alvará de funcionamento)" aria-label={`Título do requisito ${indice + 1}`} style={{ ...campoStyle, flex: '2 1 240px', fontWeight: 600 }} />
        <select value={req.tipo} onChange={(e) => mudarTipo(e.target.value as TipoRequisito)} aria-label={`Tipo do requisito ${indice + 1}`} style={{ ...campoStyle, flex: '1 1 180px' }}>
          {(Object.keys(ROTULO_TIPO_REQUISITO) as TipoRequisito[]).map((t) => <option key={t} value={t}>{ROTULO_TIPO_REQUISITO[t].texto}</option>)}
        </select>
        <span style={{ display: 'inline-flex', gap: '0.25rem' }}>
          <button type="button" onClick={() => onMover(indice - 1)} disabled={indice === 0} aria-label="Subir requisito" style={{ ...botaoIcone, opacity: indice === 0 ? 0.4 : 1 }}><IconArrowUp size={15} aria-hidden /></button>
          <button type="button" onClick={() => onMover(indice + 1)} disabled={indice === total - 1} aria-label="Descer requisito" style={{ ...botaoIcone, opacity: indice === total - 1 ? 0.4 : 1 }}><IconArrowDown size={15} aria-hidden /></button>
          <button type="button" onClick={onRemover} aria-label={`Remover requisito ${req.titulo || indice + 1}`} style={{ ...botaoIcone, color: 'var(--c-danger-text)' }}><IconTrash size={15} aria-hidden /></button>
        </span>
      </div>
      <p style={{ margin: 0, ...ajuda }}>{ROTULO_TIPO_REQUISITO[req.tipo].ajuda}</p>
      <textarea value={req.descricao ?? ''} onChange={(e) => onChange({ ...req, descricao: e.target.value || null })} maxLength={2000} rows={2} placeholder="Orientação para quem vai cumprir este requisito (opcional)" aria-label={`Orientação do requisito ${indice + 1}`} style={{ ...campoStyle, resize: 'vertical', fontFamily: 'inherit' }} />
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <input type="checkbox" checked={req.obrigatorio} onChange={(e) => onChange({ ...req, obrigatorio: e.target.checked })} /> Obrigatório
        </label>
        {req.tipo === 'arquivo' && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            Até
            <input type="number" min={1} max={10} value={req.config.max_arquivos ?? 1} onChange={(e) => onChange({ ...req, config: { max_arquivos: Number(e.target.value) || 1 } })} style={{ ...campoStyle, width: '4.5rem', padding: '0.3rem 0.5rem' }} />
            arquivos
          </label>
        )}
        {etapas.length > 1 && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            Mover para
            <select value={etapaAtual} onChange={(e) => onMoverEtapa(Number(e.target.value))} style={{ ...campoStyle, padding: '0.3rem 0.5rem' }}>
              {etapas.map((et, i) => <option key={i} value={i}>Etapa {i + 1}{et.titulo ? `: ${et.titulo}` : ''}</option>)}
            </select>
          </label>
        )}
      </div>
      {req.tipo === 'formulario' && (
        <EditorFormulario campos={req.config.campos ?? []} onChange={(campos) => onChange({ ...req, config: { campos } })} />
      )}
    </div>
  )
}

function EtapasRequisitos({ cert, onSalvo }: { cert: Certificacao; onSalvo: (c: Certificacao) => void }) {
  const [etapas, setEtapas] = useState<EtapaCertificacao[]>(cert.etapas ?? [])
  const [original, setOriginal] = useState(JSON.stringify(cert.etapas ?? []))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const alterado = JSON.stringify(etapas) !== original

  useEffect(() => {
    if (!alterado) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [alterado])

  const mudar = (fn: (e: EtapaCertificacao[]) => EtapaCertificacao[]) => {
    setOk(false)
    setEtapas(fn)
  }
  const alterarEtapa = (i: number, patch: Partial<EtapaCertificacao>) => mudar((l) => l.map((e, j) => (j === i ? { ...e, ...patch } : e)))
  const alterarRequisitos = (i: number, fn: (r: RequisitoCertificacao[]) => RequisitoCertificacao[]) =>
    mudar((l) => l.map((e, j) => (j === i ? { ...e, requisitos: fn(e.requisitos) } : e)))

  function moverParaEtapa(de: number, indice: number, para: number) {
    if (de === para) return
    mudar((l) => {
      const req = l[de].requisitos[indice]
      return l.map((e, j) => (j === de ? { ...e, requisitos: e.requisitos.filter((_, k) => k !== indice) } : j === para ? { ...e, requisitos: [...e.requisitos, req] } : e))
    })
  }

  function removerEtapa(i: number) {
    const e = etapas[i]
    if (e.requisitos.length && !confirm(`Remover a etapa "${e.titulo || i + 1}" e os ${e.requisitos.length} requisitos dela?`)) return
    mudar((l) => l.filter((_, j) => j !== i))
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    setOk(false)
    try {
      const salvo = await api.salvarEstruturaCertificacao(cert.id, etapas)
      const novas = salvo.etapas ?? []
      setEtapas(novas)
      setOriginal(JSON.stringify(novas))
      onSalvo(salvo)
      setOk(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const totalRequisitos = etapas.reduce((s, e) => s + e.requisitos.length, 0)

  return (
    <Secao
      titulo="Etapas e requisitos"
      descricao="Etapa sequencial: só libera quando a anterior for aprovada. Etapa paralela: corre junto com a anterior. Dentro de cada etapa, liste o que a empresa ou órgão precisa cumprir."
    >
      {etapas.length === 0 && <p style={{ margin: 0, color: 'var(--c-text-3)', fontSize: '0.875rem' }}>Nenhuma etapa ainda. Comece adicionando a primeira.</p>}

      {etapas.map((etapa, i) => (
        <section key={etapa.id ?? `nova-${i}`} aria-label={`Etapa ${i + 1}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--c-accent-soft-border)', background: 'var(--c-accent-soft)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-accent-text)', minWidth: '4.5rem' }}>ETAPA {i + 1}</span>
            <input value={etapa.titulo} onChange={(e) => alterarEtapa(i, { titulo: e.target.value })} maxLength={120} placeholder="Nome da etapa (ex.: Documentação)" aria-label={`Nome da etapa ${i + 1}`} style={{ ...campoStyle, flex: '2 1 220px', fontWeight: 700 }} />
            <select
              value={i === 0 ? 'sequencial' : etapa.modo}
              disabled={i === 0}
              onChange={(e) => alterarEtapa(i, { modo: e.target.value as EtapaCertificacao['modo'] })}
              aria-label={`Como a etapa ${i + 1} começa`}
              title={i === 0 ? 'A primeira etapa sempre começa sozinha' : undefined}
              style={{ ...campoStyle, flex: '1 1 200px' }}
            >
              <option value="sequencial">{i === 0 ? 'Começa na inscrição' : 'Sequencial (depois da anterior)'}</option>
              {i > 0 && <option value="paralela">Paralela (junto com a anterior)</option>}
            </select>
            <span style={{ display: 'inline-flex', gap: '0.25rem' }}>
              <button type="button" onClick={() => mudar((l) => mover(l, i, i - 1))} disabled={i === 0} aria-label="Subir etapa" style={{ ...botaoIcone, opacity: i === 0 ? 0.4 : 1 }}><IconArrowUp size={15} aria-hidden /></button>
              <button type="button" onClick={() => mudar((l) => mover(l, i, i + 1))} disabled={i === etapas.length - 1} aria-label="Descer etapa" style={{ ...botaoIcone, opacity: i === etapas.length - 1 ? 0.4 : 1 }}><IconArrowDown size={15} aria-hidden /></button>
              <button type="button" onClick={() => removerEtapa(i)} aria-label={`Remover etapa ${i + 1}`} style={{ ...botaoIcone, color: 'var(--c-danger-text)' }}><IconTrash size={15} aria-hidden /></button>
            </span>
          </div>
          <textarea value={etapa.descricao ?? ''} onChange={(e) => alterarEtapa(i, { descricao: e.target.value || null })} maxLength={2000} rows={2} placeholder="O que acontece nesta etapa (opcional)" aria-label={`Descrição da etapa ${i + 1}`} style={{ ...campoStyle, resize: 'vertical', fontFamily: 'inherit' }} />

          {etapa.requisitos.map((req, k) => (
            <EditorRequisito
              key={req.id ?? `novo-${i}-${k}`}
              req={req}
              indice={k}
              total={etapa.requisitos.length}
              etapas={etapas}
              etapaAtual={i}
              onChange={(r) => alterarRequisitos(i, (l) => l.map((x, j) => (j === k ? r : x)))}
              onMover={(para) => alterarRequisitos(i, (l) => mover(l, k, para))}
              onMoverEtapa={(para) => moverParaEtapa(i, k, para)}
              onRemover={() => alterarRequisitos(i, (l) => l.filter((_, j) => j !== k))}
            />
          ))}
          <div>
            <button type="button" onClick={() => alterarRequisitos(i, (l) => [...l, novoRequisito()])} style={botaoLinha}>
              <IconPlus size={15} aria-hidden /> Adicionar requisito nesta etapa
            </button>
          </div>
        </section>
      ))}

      <div>
        <button type="button" onClick={() => mudar((l) => [...l, { titulo: '', descricao: null, modo: 'sequencial', requisitos: [novoRequisito()] }])} style={botaoLinha}>
          <IconPlus size={16} aria-hidden /> Adicionar etapa
        </button>
      </div>

      {erro && <p role="alert" style={{ margin: 0, color: 'var(--c-danger-text)', fontSize: '0.875rem' }}>{erro}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', position: 'sticky', bottom: '0.75rem', padding: '0.75rem', borderRadius: '0.875rem', background: 'var(--c-modal-bg, var(--c-glass-bg-lg))', border: '1px solid var(--c-divider)' }}>
        <button type="button" onClick={salvar} disabled={salvando || !alterado} style={{ ...botaoAzul, opacity: salvando || !alterado ? 0.6 : 1 }}>
          <IconCheck size={16} aria-hidden /> {salvando ? 'Salvando…' : 'Salvar etapas e requisitos'}
        </button>
        <span style={{ fontSize: '0.8125rem', color: alterado ? 'var(--c-text-1)' : ok ? 'var(--c-success-text)' : 'var(--c-text-3)', fontWeight: 600 }} role="status">
          {alterado ? 'Há alterações não salvas.' : ok ? 'Etapas e requisitos salvos.' : `${etapas.length} ${etapas.length === 1 ? 'etapa' : 'etapas'}, ${totalRequisitos} ${totalRequisitos === 1 ? 'requisito' : 'requisitos'}.`}
        </span>
      </div>
    </Secao>
  )
}

// ---------- Situação ----------

function Situacao({ cert, onSalvo }: { cert: Certificacao; onSalvo: (c: Certificacao) => void }) {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const st = ROTULO_STATUS[cert.status]

  async function mudar(status: Certificacao['status']) {
    setErro('')
    setOcupado(true)
    try {
      onSalvo(await api.atualizarCertificacao(cert.id, { status }))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao mudar a situação')
    } finally {
      setOcupado(false)
    }
  }

  async function excluir() {
    if (!confirm(`Excluir "${cert.titulo}" de vez, com todas as etapas e requisitos?`)) return
    try {
      await api.excluirCertificacao(cert.id)
      router.push('/certificacoes')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  return (
    <Secao titulo="Situação" descricao="Rascunho: só o ADM vê. Publicada: aparece para empresas e órgãos se inscreverem. Arquivada: sai da busca, mas o histórico fica guardado.">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 700, color: st.cor, background: st.fundo }}>{st.texto}</span>
        {cert.status !== 'publicada' && (
          <button type="button" onClick={() => mudar('publicada')} disabled={ocupado} style={botaoAzul}>
            <IconWorldUpload size={16} aria-hidden /> Publicar
          </button>
        )}
        {cert.status === 'publicada' && (
          <button type="button" onClick={() => mudar('rascunho')} disabled={ocupado} style={botaoLinha}>Voltar para rascunho</button>
        )}
        {cert.status !== 'arquivada' && (
          <button type="button" onClick={() => mudar('arquivada')} disabled={ocupado} style={botaoLinha}>
            <IconArchive size={16} aria-hidden /> Arquivar
          </button>
        )}
        {cert.status !== 'publicada' && (
          <button type="button" onClick={excluir} style={{ ...botaoLinha, color: 'var(--c-danger-text)' }}>
            <IconTrash size={16} aria-hidden /> Excluir
          </button>
        )}
      </div>
      {erro && <p role="alert" style={{ margin: 0, color: 'var(--c-danger-text)', fontSize: '0.875rem' }}>{erro}</p>}
    </Secao>
  )
}

function Editor() {
  const id = useSearchParams().get('id') ?? ''
  const [cert, setCert] = useState<Certificacao | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!id) return
    api
      .obterCertificacao(id)
      .then(setCert)
      .catch((e) => setErro(e instanceof Error ? e.message : 'Certificação não encontrada'))
  }, [id])

  // Mantém etapas ao receber só os dados gerais do PATCH
  const atualizar = (c: Certificacao) => setCert((atual) => ({ ...c, etapas: c.etapas ?? atual?.etapas }))
  const titulo = useMemo(() => cert?.titulo ?? 'Certificação', [cert?.titulo])

  return (
    <>
      <a href="/certificacoes" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem', color: 'var(--c-accent-text)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
        <IconArrowLeft size={16} aria-hidden /> Todas as certificações
      </a>
      <ErroBanner mensagem={erro} />
      {!cert && !erro && <Carregando />}
      {cert && (
        <>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, margin: '0 0 1rem' }}>{titulo}</h2>
          <DadosGerais key={`dados-${cert.id}`} cert={cert} onSalvo={atualizar} />
          <EtapasRequisitos key={`etapas-${cert.id}`} cert={cert} onSalvo={atualizar} />
          <Situacao cert={cert} onSalvo={atualizar} />
        </>
      )}
    </>
  )
}

export default function EditarCertificacaoPage() {
  return (
    <PaginaAdmin atual="/certificacoes" titulo="Editar certificação" largura={1000}>
      <Suspense fallback={<Carregando />}>
        <Editor />
      </Suspense>
    </PaginaAdmin>
  )
}
