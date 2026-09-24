'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconAlertTriangle, IconCircleCheck, IconExternalLink, IconFlame, IconPencil, IconRefresh, IconTrendingUp } from '@tabler/icons-react'
import PaginaAdmin, { ErroBanner } from '@/components/PaginaAdmin'
import GlassCard from '@/components/GlassCard'
import { campoStyle } from '@/components/ItemEditavel'
import { api, type ConsumoInfraestrutura, type FaseConsumo, type RecursoInfraestrutura } from '@/lib/api'

const FASES: Record<FaseConsumo, { rotulo: string; cor: string; fundo: string; Icone: typeof IconCircleCheck; recomendacao: string }> = {
  tranquilo: { rotulo: 'Tranquilo', cor: 'var(--c-success-text)', fundo: 'var(--c-success-soft)', Icone: IconCircleCheck, recomendacao: 'Nada a fazer por enquanto.' },
  'prepare-se': { rotulo: 'Prepare-se', cor: 'var(--c-caution-text)', fundo: 'var(--c-caution-soft)', Icone: IconTrendingUp, recomendacao: 'Acompanhe toda semana e veja o que mais consome.' },
  planeje: { rotulo: 'Planeje o upgrade', cor: 'var(--c-orange-text)', fundo: 'var(--c-orange-soft)', Icone: IconAlertTriangle, recomendacao: 'Hora de orçar e planejar o plano maior, ou reduzir o consumo.' },
  critico: { rotulo: 'Crítico', cor: 'var(--c-danger-text)', fundo: 'var(--c-danger-soft)', Icone: IconFlame, recomendacao: 'Perto do teto: contrate o plano maior ou reduza o uso agora. Ao estourar, o serviço pode ser limitado.' },
}

// O que o próximo plano oferece, para orientar a decisão.
const PROXIMO_PLANO: Record<string, string> = {
  banco: 'Supabase Pro: 8 GB de banco por projeto.',
  storage: 'Supabase Pro: 100 GB de armazenamento.',
  autenticacoes: 'Supabase Pro: 100.000 usuários ativos por mês.',
  egress: 'Supabase Pro: 250 GB de tráfego por mês.',
  requisicoes: 'Cloudflare Workers Paid (US$ 5/mês): 10 milhões de requisições por mês.',
}

const PERIODO: Record<RecursoInfraestrutura['periodo'], string> = {
  total: 'Acumulado (não zera)',
  mes: 'Zera todo dia 1º',
  dia: 'Zera à meia-noite UTC (21h em Brasília)',
}

function formatar(valor: number, unidade: RecursoInfraestrutura['unidade']) {
  if (unidade !== 'bytes') return valor.toLocaleString('pt-BR')
  const passos = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = valor
  let i = 0
  while (v >= 1024 && i < passos.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: v < 10 && i > 0 ? 2 : 1 })} ${passos[i]}`
}

// Converte o que o admin digitou (na mesma unidade exibida: MB/GB para bytes).
function paraUnidadeBase(texto: string, unidade: RecursoInfraestrutura['unidade']) {
  const m = texto.trim().replace(/\./g, '').replace(',', '.').match(/^([\d.]+)\s*(kb|mb|gb|tb)?$/i)
  if (!m) return NaN
  const n = Number(m[1])
  if (unidade !== 'bytes') return n
  const mult = { kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 }[(m[2] ?? 'mb').toLowerCase() as 'kb']
  return n * mult
}

function Selo({ fase }: { fase: FaseConsumo }) {
  const f = FASES[fase]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: f.fundo, color: f.cor, fontSize: '0.8125rem', fontWeight: 700 }}>
      <f.Icone size={16} aria-hidden /> {f.rotulo}
    </span>
  )
}

function Barra({ percentual, fase }: { percentual: number; fase: FaseConsumo }) {
  const largura = Math.min(100, Math.max(percentual, percentual > 0 ? 1 : 0))
  return (
    <div style={{ position: 'relative', paddingBottom: '1.1rem' }}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentual)}
        aria-label={`${percentual.toFixed(1)}% do teto`}
        style={{ position: 'relative', height: '0.75rem', borderRadius: '9999px', background: 'var(--c-divider)', overflow: 'hidden' }}
      >
        <div style={{ width: `${largura}%`, height: '100%', borderRadius: '9999px', background: FASES[fase].cor, transition: 'width 400ms ease' }} />
      </div>
      {[50, 75, 90].map((m) => (
        <div key={m} aria-hidden style={{ position: 'absolute', left: `${m}%`, top: 0 }}>
          <div style={{ width: '2px', height: '0.75rem', background: 'var(--c-bg, #fff)', opacity: 0.9, transform: 'translateX(-1px)' }} />
          <span style={{ position: 'absolute', top: '0.85rem', transform: 'translateX(-50%)', fontSize: '0.6875rem', color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>{m}%</span>
        </div>
      ))}
    </div>
  )
}

function CardRecurso({ r, painel, onLimite }: { r: RecursoInfraestrutura; painel: string; onLimite: (limite: number) => Promise<void> }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')

  async function salvar() {
    const limite = paraUnidadeBase(texto, r.unidade)
    if (!Number.isFinite(limite) || limite <= 0) {
      setErro(r.unidade === 'bytes' ? 'Use um número com unidade, ex.: 8 GB' : 'Use um número maior que zero')
      return
    }
    try {
      await onLimite(limite)
      setEditando(false)
      setErro('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  const indisponivel = r.uso === null || r.percentual === null || r.fase === null

  return (
    <GlassCard style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{r.rotulo}</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--c-text-3)', margin: '0.125rem 0 0' }}>{PERIODO[r.periodo]}</p>
        </div>
        {!indisponivel && <Selo fase={r.fase!} />}
      </div>

      {indisponivel ? (
        r.erro === 'indisponivel' ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)', lineHeight: 1.55, margin: 0 }}>
            O Supabase não oferece este número por API. Teto do plano: <strong>{formatar(r.limite, r.unidade)}</strong> por mês.{' '}
            <a href={painel} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-accent-text)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              Ver no painel do Supabase <IconExternalLink size={14} aria-hidden />
            </a>
          </p>
        ) : r.erro === 'aguardando-token' ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)', lineHeight: 1.55, margin: 0 }}>
            Aguardando o token de análise do Cloudflare (secret <code>CLOUDFLARE_ANALYTICS_TOKEN</code> no GitHub). Teto do plano: <strong>{formatar(r.limite, r.unidade)}</strong> por dia.
          </p>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--c-danger-text)', margin: 0 }}>{r.erro ?? 'Leitura indisponível no momento.'}</p>
        )
      ) : (
        <>
          <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.5, color: FASES[r.fase!].cor, fontWeight: 600 }}>{FASES[r.fase!].recomendacao}</p>
          <Barra percentual={r.percentual!} fase={r.fase!} />
          <p style={{ margin: 0, fontSize: '0.9375rem' }}>
            <strong>{formatar(r.uso!, r.unidade)}</strong> de {formatar(r.limite, r.unidade)}{' '}
            <span style={{ color: 'var(--c-text-3)' }}>({r.percentual!.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)</span>
          </p>
          {r.previsao && <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>{r.previsao.texto}.</p>}
          {r.aviso && <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--c-warning-text)' }}>{r.aviso}.</p>}
          {r.fase !== 'tranquilo' && PROXIMO_PLANO[r.recurso] && (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>Próximo plano — {PROXIMO_PLANO[r.recurso]}</p>
          )}
          {r.detalhes && r.detalhes.length > 1 && (
            <details style={{ fontSize: '0.8125rem', color: 'var(--c-text-2)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Detalhes por {r.recurso === 'requisicoes' ? 'Worker' : 'projeto'}</summary>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {r.detalhes.map((d) => (
                  <li key={d.nome}>
                    {d.nome}: {d.uso === null ? <span style={{ color: 'var(--c-danger-text)' }}>{d.erro ?? 'indisponível'}</span> : formatar(d.uso, r.unidade)}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '0.25rem' }}>
        {editando ? (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && salvar()}
              aria-label={`Novo teto de ${r.rotulo}`}
              placeholder={r.unidade === 'bytes' ? 'ex.: 8 GB' : 'ex.: 100000'}
              style={{ ...campoStyle, flex: 1, minWidth: '8rem' }}
            />
            <button type="button" onClick={salvar} style={{ ...campoStyle, cursor: 'pointer', fontWeight: 700 }}>Salvar</button>
            <button type="button" onClick={() => { setEditando(false); setErro('') }} style={{ ...campoStyle, cursor: 'pointer' }}>Cancelar</button>
            {erro && <p style={{ width: '100%', margin: 0, fontSize: '0.8125rem', color: 'var(--c-danger-text)' }}>{erro}</p>}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setTexto(formatar(r.limite, r.unidade)); setEditando(true) }}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--c-text-3)', fontSize: '0.8125rem', fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <IconPencil size={14} aria-hidden /> Ajustar teto (após mudar de plano)
          </button>
        )}
      </div>
    </GlassCard>
  )
}

export default function InfraestruturaPage() {
  const [dados, setDados] = useState<ConsumoInfraestrutura | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(() => {
    setCarregando(true)
    setErro('')
    api
      .consumoInfraestrutura()
      .then(setDados)
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar o consumo'))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function atualizarLimite(recurso: string, limite: number) {
    await api.atualizarLimiteInfraestrutura(recurso, limite)
    carregar()
  }

  const fases = dados?.recursos.flatMap((r) => (r.fase ? [r.fase] : [])) ?? []
  const pior = (['critico', 'planeje', 'prepare-se', 'tranquilo'] as FaseConsumo[]).find((f) => fases.includes(f))
  const atencao = dados?.recursos.filter((r) => r.fase && r.fase !== 'tranquilo') ?? []

  return (
    <PaginaAdmin
      atual="/infraestrutura"
      titulo="Consumo de recursos em infraestrutura"
      descricao="Uso atual comparado ao teto do plano gratuito. Os dois projetos do Supabase são somados, porque a cota é da organização."
      largura={1100}
    >
      <ErroBanner mensagem={erro} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {pior && (
            <>
              <span style={{ fontWeight: 700 }}>Situação geral:</span>
              <Selo fase={pior} />
              <span style={{ fontSize: '0.875rem', color: 'var(--c-text-2)' }}>
                {atencao.length === 0 ? 'todos os recursos com folga.' : `pedem atenção: ${atencao.map((r) => r.rotulo).join(', ')}.`}
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {dados && <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>Lido em {new Date(dados.atualizado_em).toLocaleString('pt-BR')}</span>}
          <button type="button" onClick={carregar} disabled={carregando} style={{ ...campoStyle, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontWeight: 600 }}>
            <IconRefresh size={16} aria-hidden /> Atualizar
          </button>
        </div>
      </div>

      {carregando && !dados && <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>}

      {dados && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1rem' }}>
            {dados.recursos.map((r) => (
              <CardRecurso key={r.recurso} r={r} painel={dados.painel_supabase} onLimite={(l) => atualizarLimite(r.recurso, l)} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <GlassCard style={{ padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem' }}>O que significa cada indicador</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {([['tranquilo', 'abaixo de 50% do teto'], ['prepare-se', 'de 50% a 75%'], ['planeje', 'de 75% a 90%'], ['critico', 'acima de 90%']] as [FaseConsumo, string][]).map(([f, faixa]) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--c-text-2)' }}>
                    <Selo fase={f} /> {faixa}
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)', margin: '0.75rem 0 0', lineHeight: 1.5 }}>
                Se o ritmo atual indicar que o teto será atingido antes do fim do período (ou em até 30 dias, nos acumulados), o indicador sobe para “Planeje o upgrade” mesmo abaixo de 75%.
              </p>
            </GlassCard>

            {dados.maiores_tabelas.length > 0 && (
              <GlassCard style={{ padding: '1.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem' }}>O que mais ocupa o banco</h2>
                <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem' }}>
                  {dados.maiores_tabelas.map((t) => (
                    <li key={`${t.projeto}-${t.nome}`}>
                      <code>{t.nome}</code> — {formatar(t.bytes, 'bytes')} <span style={{ color: 'var(--c-text-3)', fontSize: '0.75rem' }}>({t.projeto.split(' ')[0]})</span>
                    </li>
                  ))}
                </ol>
              </GlassCard>
            )}
          </div>
        </>
      )}
    </PaginaAdmin>
  )
}
