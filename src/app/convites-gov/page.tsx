'use client'

import { useEffect, useState } from 'react'
import AdminNav, { useRequireAuth } from '@/components/AdminNav'
import GlassCard from '@/components/GlassCard'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import { KeyIcon } from '@/components/icons'
import { api, type ConviteGov } from '@/lib/api'
import { UFS } from '@/lib/uf'

const AREA03_FRONTEND_URL = process.env.NEXT_PUBLIC_AREA03_FRONTEND_URL ?? ''

export default function ConvitesGovPage() {
  const pronto = useRequireAuth()
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [dias, setDias] = useState('7')
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState('')
  const [convites, setConvites] = useState<ConviteGov[]>([])
  const [copiado, setCopiado] = useState<string | null>(null)

  function carregar() {
    api.listarConvites().then((r) => setConvites(r.convites)).catch((e) => setErro(e.message))
  }

  useEffect(() => {
    if (!pronto) return
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto])

  function linkConvite(token: string) {
    return AREA03_FRONTEND_URL ? `${AREA03_FRONTEND_URL}/convite?token=${token}` : `?token=${token}`
  }

  async function copiar(token: string) {
    try {
      await navigator.clipboard.writeText(linkConvite(token))
      setCopiado(token)
      setTimeout(() => setCopiado(null), 2000)
    } catch {
      // clipboard indisponível — ignora silenciosamente
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cidade.trim()) {
      setErro('Informe a cidade')
      return
    }
    setErro('')
    setCriando(true)
    try {
      await api.criarConvite({ cidade: cidade.trim(), uf: uf || undefined, dias_validade: Number(dias) || 7 })
      setCidade('')
      setUf('')
      setDias('7')
      carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar convite')
    } finally {
      setCriando(false)
    }
  }

  if (!pronto) return null

  return (
    <>
      <Grain />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminNav atual="/convites-gov" />
        <main id="conteudo" tabIndex={-1} style={{ flex: 1, maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem 3rem', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Convites para contas Gov
          </h1>

          <GlassCard style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <Input
                  label="Cidade"
                  placeholder="Ex.: Florianópolis"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  leadingIcon={<KeyIcon />}
                />
              </div>
              <div style={{ width: '120px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--c-input-label)',
                    letterSpacing: '0.01em',
                    marginBottom: '0.375rem',
                  }}
                >
                  UF
                </label>
                <select
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    background: 'var(--c-input-bg)',
                    border: '1px solid var(--c-input-border)',
                    borderRadius: '0.75rem',
                    color: 'var(--c-input-text)',
                    fontSize: '0.9375rem',
                  }}
                >
                  <option value="">--</option>
                  {UFS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ width: '120px' }}>
                <Input
                  label="Validade (dias)"
                  type="number"
                  min={1}
                  value={dias}
                  onChange={(e) => setDias(e.target.value)}
                />
              </div>
              <Button type="submit" loading={criando}>
                Gerar convite
              </Button>
            </form>
            {erro && <p style={{ color: 'var(--c-danger-text)', fontSize: '0.875rem', marginTop: '1rem' }}>{erro}</p>}
          </GlassCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {convites.length === 0 && <p style={{ color: 'var(--c-text-3)' }}>Nenhum convite gerado ainda.</p>}
            {convites.map((c) => (
              <GlassCard key={c.token} style={{ padding: '1.125rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>
                      {c.cidade}
                      {c.uf ? `/${c.uf}` : ''}{' '}
                      {c.usado && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--c-text-3)', fontWeight: 400 }}>(já utilizado)</span>
                      )}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
                      Expira em {new Date(c.expira_em).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {!c.usado && (
                    <Button variant="secondary" size="sm" onClick={() => copiar(c.token)}>
                      {copiado === c.token ? 'Copiado!' : 'Copiar link'}
                    </Button>
                  )}
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
