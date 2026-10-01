'use client'

import GlassCard from '@/components/GlassCard'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import { LOGO_DATA_URI } from '@/lib/logo'
import { useTituloPagina } from '@/lib/useTituloPagina'

// O cadastro aberto (com código) foi substituído por convites: quem gerencia
// os administradores convida pelo painel e escolhe as permissões.
export default function SignupPage() {
  useTituloPagina('Acesso por convite')
  return (
    <>
      <Grain />
      <div id="conteudo" tabIndex={-1} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <GlassCard variant="lg" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DATA_URI} alt="Plura" style={{ height: '48px', margin: '0 auto 1.25rem', display: 'block' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Acesso somente por convite</h1>
          <p style={{ color: 'var(--c-text-2)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Novos administradores recebem um convite por e-mail de quem gerencia o painel. Pelo link do convite você cria a sua senha.
          </p>
          <a href="/login" style={{ color: 'var(--c-text-blue)', fontWeight: 700 }}>
            Já tenho acesso, quero entrar
          </a>
        </GlassCard>
        <Footer />
      </div>
    </>
  )
}
