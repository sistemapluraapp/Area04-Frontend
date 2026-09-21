'use client'

import { useEffect, useState } from 'react'
import AdminNav, { useRequireAuth } from '@/components/AdminNav'
import GlassCard from '@/components/GlassCard'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import { api, type Indicadores } from '@/lib/api'

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

export default function DashboardPage() {
  const pronto = useRequireAuth()
  const [dados, setDados] = useState<Indicadores | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!pronto) return
    api
      .indicadores()
      .then(setDados)
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar indicadores'))
  }, [pronto])

  if (!pronto) return null

  return (
    <>
      <Grain />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminNav atual="/dashboard" />
        <main style={{ flex: 1, maxWidth: '1080px', margin: '0 auto', padding: '0 1.5rem 3rem', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>Indicadores</h1>

          {erro && (
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
              {erro}
            </div>
          )}

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
        </main>
        <Footer />
      </div>
    </>
  )
}
