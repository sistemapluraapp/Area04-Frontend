'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GlassCard from '@/components/GlassCard'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import { EmailIcon, LockIcon, EyeIcon, UserIcon, KeyIcon } from '@/components/icons'
import { api } from '@/lib/api'
import { salvarSessao } from '@/lib/auth'
import { LOGO_DATA_URI } from '@/lib/logo'

export default function SignupPage() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

  function validate() {
    const e: Record<string, string> = {}
    if (!codigo.trim()) e.codigo = 'Informe o código de administrador'
    if (!nome.trim()) e.nome = 'Nome é obrigatório'
    if (!email.includes('@')) e.email = 'E-mail inválido'
    if (senha.length < 6) e.senha = 'Mínimo 6 caracteres'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setGeneralError('')
    setLoading(true)
    try {
      const resposta = await api.signup({ codigo: codigo.trim(), nome: nome.trim(), email: email.trim(), password: senha })
      if ('pending_email_confirmation' in resposta) {
        setSucesso('Conta criada! Verifique seu e-mail para confirmar antes de fazer login.')
        return
      }
      salvarSessao(resposta)
      router.push('/dashboard')
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Não foi possível criar a conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Grain />
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <GlassCard variant="lg" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_DATA_URI} alt="Plura" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} draggable={false} />
          </div>

          {sucesso ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#22c55e', fontWeight: 600, marginBottom: '0.5rem' }}>{sucesso}</p>
              <a href="/login" style={{ color: 'var(--c-text-blue)' }}>
                Ir para o login →
              </a>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.035em', marginBottom: '0.375rem' }}>
                  Criar conta de administrador
                </h1>
                <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-2)' }}>Requer um código de administrador válido</p>
              </div>

              {generalError && (
                <div
                  style={{
                    margin: '1rem 0 0',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    fontSize: '0.875rem',
                    color: '#f87171',
                    textAlign: 'center',
                  }}
                >
                  {generalError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  <Input
                    label="Código de administrador"
                    placeholder="Código fornecido pela Plura"
                    value={codigo}
                    onChange={(e) => {
                      setCodigo(e.target.value)
                      setErrors((p) => ({ ...p, codigo: '' }))
                    }}
                    error={errors.codigo}
                    leadingIcon={<KeyIcon />}
                  />
                  <Input
                    label="Nome completo"
                    placeholder="Seu nome completo"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value)
                      setErrors((p) => ({ ...p, nome: '' }))
                    }}
                    error={errors.nome}
                    leadingIcon={<UserIcon />}
                  />
                  <Input
                    label="E-mail"
                    type="email"
                    placeholder="voce@plura.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setErrors((p) => ({ ...p, email: '' }))
                    }}
                    error={errors.email}
                    leadingIcon={<EmailIcon />}
                  />
                  <Input
                    label="Senha"
                    type={showSenha ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value)
                      setErrors((p) => ({ ...p, senha: '' }))
                    }}
                    error={errors.senha}
                    leadingIcon={<LockIcon />}
                    trailingIcon={
                      <button
                        type="button"
                        onClick={() => setShowSenha((v) => !v)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'inherit' }}
                      >
                        <EyeIcon off={showSenha} />
                      </button>
                    }
                  />
                </div>

                <Button type="submit" size="lg" loading={loading} style={{ width: '100%', marginTop: '1.75rem' }}>
                  {loading ? 'Criando conta…' : 'Criar conta'}
                </Button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '0.9375rem', color: 'var(--c-text-2)', marginTop: '1.5rem' }}>
                Já tem uma conta?{' '}
                <a href="/login" style={{ color: 'var(--c-text-blue)', fontWeight: 600, textDecoration: 'none' }}>
                  Entrar →
                </a>
              </p>
            </>
          )}
        </GlassCard>

        <Footer />
      </div>
    </>
  )
}
