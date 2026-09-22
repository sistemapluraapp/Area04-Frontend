'use client'

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AdminNav, { useRequireAuth } from '@/components/AdminNav'
import GlassCard from '@/components/GlassCard'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import { api, type Estatisticas, type Indicadores } from '@/lib/api'

const CHART_BLUE = '#3d94ff'
const CHART_AMBER = '#f0b429'
const CHART_GRID = 'rgba(255,255,255,0.08)'
const CHART_TICK = 'rgba(255,255,255,0.45)'
const CHART_TOOLTIP_BG = 'rgba(10,12,24,0.92)'
const CHART_TOOLTIP_BORDER = 'rgba(255,255,255,0.14)'

const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function formatarMes(mes: string) {
  const [ano, m] = mes.split('-')
  const idx = Number(m) - 1
  const nome = MESES_PT[idx] ?? mes
  return `${nome}/${ano.slice(2)}`
}

function Metrica({ label, valor }: { label: string; valor: number }) {
  return (
    <GlassCard style={{ padding: '1.5rem' }}>
      <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{valor}</p>
    </GlassCard>
  )
}

function tooltipStyle() {
  return {
    contentStyle: {
      background: CHART_TOOLTIP_BG,
      border: `1px solid ${CHART_TOOLTIP_BORDER}`,
      borderRadius: '0.625rem',
      fontSize: '0.8125rem',
      fontFamily: 'var(--font-sans)',
      color: 'var(--c-text-1)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    },
    labelStyle: { color: 'var(--c-text-2)', marginBottom: '0.25rem' },
    cursor: { fill: 'rgba(255,255,255,0.05)' },
  }
}

function GraficoBarras({
  titulo,
  dados,
  chaves,
}: {
  titulo: string
  dados: { mes: string; [key: string]: string | number }[]
  chaves: { chave: string; nome: string; cor: string }[]
}) {
  const tt = tooltipStyle()
  return (
    <GlassCard style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--c-text-1)' }}>{titulo}</h2>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fill: CHART_TICK, fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: CHART_GRID }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: CHART_TICK, fontSize: 11, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip {...tt} />
            {chaves.length > 1 && (
              <Legend
                wrapperStyle={{ fontSize: '0.75rem', color: 'var(--c-text-2)', paddingTop: '0.5rem' }}
                iconType="circle"
                iconSize={8}
              />
            )}
            {chaves.map((c) => (
              <Bar key={c.chave} dataKey={c.chave} name={c.nome} fill={c.cor} radius={[4, 4, 0, 0]} maxBarSize={28} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}

function ErroBanner({ mensagem }: { mensagem: string }) {
  return (
    <div
      style={{
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.3)',
        fontSize: '0.875rem',
        color: '#f87171',
      }}
    >
      {mensagem}
    </div>
  )
}

export default function DashboardPage() {
  const pronto = useRequireAuth()
  const [dados, setDados] = useState<Indicadores | null>(null)
  const [erro, setErro] = useState('')
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [erroEstatisticas, setErroEstatisticas] = useState('')

  useEffect(() => {
    if (!pronto) return
    api
      .indicadores()
      .then(setDados)
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar indicadores'))
    api
      .estatisticas()
      .then(setEstatisticas)
      .catch((e) => setErroEstatisticas(e instanceof Error ? e.message : 'Erro ao carregar estatísticas'))
  }, [pronto])

  if (!pronto) return null

  const serieMensal = estatisticas?.meses.map((mes, i) => ({
    mes: formatarMes(mes),
    usuarios: estatisticas.usuarios_por_mes[i],
    empresas: estatisticas.empresas_por_mes[i],
    gov: estatisticas.gov_por_mes[i],
    logins_pessoa_empresa: estatisticas.logins_pessoa_empresa_por_mes[i],
    logins_gov: estatisticas.logins_gov_por_mes[i],
  }))

  return (
    <>
      <Grain />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminNav atual="/dashboard" />
        <main style={{ flex: 1, maxWidth: '1080px', margin: '0 auto', padding: '0 1.5rem 3rem', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>Indicadores</h1>

          {erro && <ErroBanner mensagem={erro} />}

          {!dados && !erro && <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>}

          {dados && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              <Metrica label="Usuários" valor={dados.usuarios} />
              <Metrica label="Contas Gov" valor={dados.contas_gov} />
              <Metrica label="Páginas privadas" valor={dados.paginas_privadas} />
              <Metrica label="Páginas públicas" valor={dados.paginas_publicas} />
              <Metrica label="Avaliações" valor={dados.avaliacoes} />
              <Metrica label="Avaliações sinalizadas" valor={dados.avaliacoes_sinalizadas} />
              <Metrica label="Certificados pendentes" valor={dados.certificados_pendentes} />
              <Metrica label="Certificados aprovados" valor={dados.certificados_aprovados} />
              <Metrica label="Certificados reprovados" valor={dados.certificados_reprovados} />
            </div>
          )}

          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '2.5rem 0 1.5rem' }}>
            Últimos 12 meses
          </h2>

          {erroEstatisticas && <ErroBanner mensagem={erroEstatisticas} />}

          {!estatisticas && !erroEstatisticas && (
            <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>
          )}

          {serieMensal && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
              <GraficoBarras
                titulo="Usuários por mês"
                dados={serieMensal}
                chaves={[{ chave: 'usuarios', nome: 'Usuários', cor: CHART_BLUE }]}
              />
              <GraficoBarras
                titulo="Empreendimentos por mês"
                dados={serieMensal}
                chaves={[{ chave: 'empresas', nome: 'Empreendimentos', cor: CHART_BLUE }]}
              />
              <GraficoBarras
                titulo="Contas Gov por mês"
                dados={serieMensal}
                chaves={[{ chave: 'gov', nome: 'Contas Gov', cor: CHART_BLUE }]}
              />
              <GraficoBarras
                titulo="Logins por mês"
                dados={serieMensal}
                chaves={[
                  { chave: 'logins_pessoa_empresa', nome: 'Pessoa/Empresa', cor: CHART_BLUE },
                  { chave: 'logins_gov', nome: 'Gov', cor: CHART_AMBER },
                ]}
              />
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  )
}
