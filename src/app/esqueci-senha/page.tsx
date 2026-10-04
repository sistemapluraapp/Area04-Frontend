'use client'

import { useState } from 'react'
import GlassCard from '@/components/GlassCard'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import AcessoRapido from '@/components/AcessoRapido'
import Footer from '@/components/Footer'
import { EmailIcon } from '@/components/icons'
import { LOGO_DATA_URI } from '@/lib/logo'
import { useTituloPagina } from '@/lib/useTituloPagina'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''

// "Esqueci minha senha": pede o link de recuperação por e-mail
export default function EsqueciSenhaPage() {
  useTituloPagina('Esqueci minha senha')
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErro('Informe um e-mail válido')
    setEnviando(true)
    try {
      const res = await fetch(`${BASE_URL}/auth/esqueci-senha`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) })
      const dados = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
      if (!res.ok) throw new Error(dados.error ?? 'Não foi possível enviar o link agora')
      setMensagem(dados.message ?? 'Se houver uma conta com este e-mail, enviamos um link para criar uma nova senha.')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar o link agora')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Grain />
      <AcessoRapido />
      <div id="conteudo" tabIndex={-1} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', position: 'relative', zIndex: 1 }}>
        <GlassCard variant="lg" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_DATA_URI} alt="Plura" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} draggable={false} />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.035em', marginBottom: '0.375rem' }}>Esqueci minha senha</h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-2)', lineHeight: 1.5 }}>Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.</p>
          </div>

          {mensagem ? (
            <div role="status" style={{ padding: '1rem', borderRadius: '0.875rem', background: 'var(--c-success-soft, rgba(34,197,94,0.12))', border: '1px solid rgba(34,197,94,0.35)', color: 'var(--c-text-1)', fontSize: '0.9375rem', lineHeight: 1.55, textAlign: 'center' }}>
              {mensagem}
            </div>
          ) : (
            <form onSubmit={enviar} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              {erro && (
                <div role="alert" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--c-danger-soft)', border: '1px solid var(--c-danger-border)', fontSize: '0.875rem', color: 'var(--c-danger-text)', textAlign: 'center' }}>
                  {erro}
                </div>
              )}
              <Input label="E-mail" type="email" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} leadingIcon={<EmailIcon />} autoComplete="email" autoFocus />
              <Button type="submit" size="lg" loading={enviando} style={{ width: '100%' }}>
                {enviando ? 'Enviando…' : 'Enviar link'}
              </Button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: '0.9375rem', color: 'var(--c-text-2)', marginTop: '1.5rem' }}>
            <a href="/login" style={{ color: 'var(--c-text-blue)', fontWeight: 600, textDecoration: 'none' }}>
              ← Voltar para o login
            </a>
          </p>
        </GlassCard>
        <Footer />
      </div>
    </>
  )
}
