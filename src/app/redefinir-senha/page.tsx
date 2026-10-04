'use client'

import { useEffect, useState } from 'react'
import GlassCard from '@/components/GlassCard'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import AcessoRapido from '@/components/AcessoRapido'
import Footer from '@/components/Footer'
import { EyeIcon, LockIcon } from '@/components/icons'
import { LOGO_DATA_URI } from '@/lib/logo'
import { useTituloPagina } from '@/lib/useTituloPagina'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
const MINIMO = 8

// Lê o acesso temporário que veio no link do e-mail de recuperação
function lerLink(): { token: string | null; erro: string | null } {
  const t = new URLSearchParams(window.location.search).get('token')
  return { token: t, erro: null }
}

// Tela aberta pelo link do e-mail "Esqueci minha senha"
export default function RedefinirSenhaPage() {
  useTituloPagina('Criar nova senha')
  const [token, setToken] = useState<string | null>(null)
  const [erroLink, setErroLink] = useState<string | null>(null)
  const [lido, setLido] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [concluido, setConcluido] = useState(false)

  useEffect(() => {
    const { token: t, erro: e } = lerLink()
    setToken(t)
    setErroLink(e)
    setLido(true)
    // Tira o token da barra de endereço (não fica no histórico)
    if (t) window.history.replaceState(null, '', window.location.pathname)
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (senha.length < MINIMO) return setErro(`A senha precisa ter pelo menos ${MINIMO} caracteres`)
    if (senha !== confirma) return setErro('As senhas não coincidem')
    setSalvando(true)
    try {
      const res = await fetch(`${BASE_URL}/auth/redefinir-senha`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, senha }) })
      const dados = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(dados.error ?? 'Não foi possível alterar a senha agora')
      setConcluido(true)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível alterar a senha agora')
    } finally {
      setSalvando(false)
    }
  }

  const linkValido = lido && token && !erroLink
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
          <h1 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.035em', marginBottom: '1.25rem' }}>{concluido ? 'Senha alterada' : 'Criar nova senha'}</h1>

          {!lido ? (
            <p style={{ textAlign: 'center', color: 'var(--c-text-3)' }}>Verificando o link…</p>
          ) : concluido ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p role="status" style={{ color: 'var(--c-text-2)', lineHeight: 1.55 }}>Pronto! Sua nova senha já vale. Entre com ela para continuar.</p>
              <Button size="lg" style={{ width: '100%' }} onClick={() => (window.location.href = '/login')}>
                Ir para o login
              </Button>
            </div>
          ) : !linkValido ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p role="alert" style={{ color: 'var(--c-text-2)', lineHeight: 1.55 }}>{erroLink ?? 'Este link não é válido.'} Peça um novo link para criar sua senha.</p>
              <Button size="lg" style={{ width: '100%' }} onClick={() => (window.location.href = '/esqueci-senha')}>
                Pedir novo link
              </Button>
            </div>
          ) : (
            <form onSubmit={salvar} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              {erro && (
                <div role="alert" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--c-danger-soft)', border: '1px solid var(--c-danger-border)', fontSize: '0.875rem', color: 'var(--c-danger-text)', textAlign: 'center' }}>
                  {erro}
                  {/expirou|usado|inválido/i.test(erro) && (
                    <>
                      {' '}
                      <a href="/esqueci-senha" style={{ color: 'inherit', fontWeight: 700 }}>
                        Pedir novo link
                      </a>
                    </>
                  )}
                </div>
              )}
              <Input
                label="Nova senha"
                type={mostrar ? 'text' : 'password'}
                placeholder={`Mínimo ${MINIMO} caracteres`}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                leadingIcon={<LockIcon />}
                autoComplete="new-password"
                autoFocus
                trailingIcon={
                  <button type="button" onClick={() => setMostrar((v) => !v)} aria-label={mostrar ? 'Esconder senha' : 'Mostrar senha'} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'inherit' }}>
                    <EyeIcon off={mostrar} />
                  </button>
                }
              />
              <Input label="Confirmar nova senha" type={mostrar ? 'text' : 'password'} placeholder="Repita a senha" value={confirma} onChange={(e) => setConfirma(e.target.value)} leadingIcon={<LockIcon />} autoComplete="new-password" />
              <Button type="submit" size="lg" loading={salvando} style={{ width: '100%' }}>
                {salvando ? 'Salvando…' : 'Salvar nova senha'}
              </Button>
            </form>
          )}
        </GlassCard>
        <Footer />
      </div>
    </>
  )
}
