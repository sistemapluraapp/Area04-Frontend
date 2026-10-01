'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import { LockIcon } from '@/components/icons'
import { api } from '@/lib/api'
import { salvarSessao } from '@/lib/auth'
import { destinoInicial } from '@/lib/destinoInicial'
import { LOGO_DATA_URI } from '@/lib/logo'
import { useTituloPagina } from '@/lib/useTituloPagina'

function AceitarConvite() {
  useTituloPagina('Aceitar convite de administrador')
  const router = useRouter()
  const token = useSearchParams().get('token') ?? ''
  const [convite, setConvite] = useState<{ nome: string; email: string } | null>(null)
  const [invalido, setInvalido] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!token) return setInvalido(true)
    api
      .verConviteAdmin(token)
      .then(setConvite)
      .catch(() => setInvalido(true))
  }, [token])

  async function aceitar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
    if (senha !== confirmacao) return setErro('As senhas não conferem.')
    setSalvando(true)
    try {
      const auth = await api.aceitarConviteAdmin(token, senha)
      salvarSessao(auth)
      const { admin } = await api.meuAcesso()
      router.replace(destinoInicial(admin))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível aceitar o convite')
      setSalvando(false)
    }
  }

  return (
    <GlassCard variant="lg" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_DATA_URI} alt="Plura" style={{ height: '48px', margin: '0 auto 1.25rem', display: 'block' }} />
      {invalido ? (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Convite inválido ou expirado</h1>
          <p style={{ color: 'var(--c-text-2)', lineHeight: 1.6, marginBottom: '1.25rem' }}>Peça um novo convite a quem gerencia os administradores. Se você já criou sua senha, é só entrar.</p>
          <a href="/login" style={{ color: 'var(--c-text-blue)', fontWeight: 700 }}>Ir para o login</a>
        </div>
      ) : !convite ? (
        <p style={{ textAlign: 'center', color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>verificando convite…</p>
      ) : (
        <>
          <h1 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.375rem' }}>Olá, {convite.nome}!</h1>
          <p style={{ textAlign: 'center', color: 'var(--c-text-2)', marginBottom: '1.5rem', lineHeight: 1.55 }}>
            Crie a senha de acesso ao painel da Plura para <strong>{convite.email}</strong>.
          </p>
          <form onSubmit={aceitar} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Nova senha (mínimo 8 caracteres)" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} leadingIcon={<LockIcon />} />
            <Input label="Confirme a senha" type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} leadingIcon={<LockIcon />} />
            {erro && <p role="alert" style={{ margin: 0, color: 'var(--c-danger-text)', fontSize: '0.875rem' }}>{erro}</p>}
            <Button type="submit" size="lg" loading={salvando} style={{ width: '100%' }}>
              {salvando ? 'Entrando…' : 'Criar senha e entrar'}
            </Button>
          </form>
        </>
      )}
    </GlassCard>
  )
}

export default function AceitarConvitePage() {
  return (
    <>
      <Grain />
      <div id="conteudo" tabIndex={-1} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <Suspense fallback={null}>
          <AceitarConvite />
        </Suspense>
        <Footer />
      </div>
    </>
  )
}
