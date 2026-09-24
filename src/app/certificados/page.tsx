'use client'

import { useEffect, useState } from 'react'
import AdminNav, { useRequireAuth } from '@/components/AdminNav'
import GlassCard from '@/components/GlassCard'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import { CertificateIcon } from '@/components/icons'
import { api, type Certificado } from '@/lib/api'

export default function CertificadosPage() {
  const pronto = useRequireAuth()
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState<string | null>(null)

  function carregar() {
    api
      .certificadosPendentes()
      .then((r) => setCertificados(r.certificados))
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar certificados'))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    if (!pronto) return
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto])

  async function decidir(id: string, status: 'aprovado' | 'reprovado') {
    setProcessando(id)
    try {
      await api.atualizarCertificado(id, status)
      setCertificados((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar certificado')
    } finally {
      setProcessando(null)
    }
  }

  if (!pronto) return null

  return (
    <>
      <Grain />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminNav atual="/certificados" />
        <main id="conteudo" tabIndex={-1} style={{ flex: 1, maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem 3rem', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Certificados pendentes
          </h1>

          {erro && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: 'var(--c-danger-soft)',
                border: '1px solid var(--c-danger-border)',
                fontSize: '0.875rem',
                color: 'var(--c-danger-text)',
              }}
            >
              {erro}
            </div>
          )}

          {carregando && <p style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>carregando…</p>}

          {!carregando && certificados.length === 0 && !erro && (
            <p style={{ color: 'var(--c-text-3)' }}>Nenhum certificado pendente.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {certificados.map((c) => (
              <GlassCard key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--c-text-blue)' }}>
                    <CertificateIcon />
                  </span>
                  <div>
                    <p style={{ fontWeight: 700 }}>{c.pagina_nome}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
                      Solicitado em {new Date(c.solicitado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={processando === c.id}
                    onClick={() => decidir(c.id, 'reprovado')}
                  >
                    Reprovar
                  </Button>
                  <Button
                    size="sm"
                    loading={processando === c.id}
                    onClick={() => decidir(c.id, 'aprovado')}
                  >
                    Aprovar
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
