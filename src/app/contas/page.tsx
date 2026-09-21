'use client'

import { useEffect, useState } from 'react'
import AdminNav, { useRequireAuth } from '@/components/AdminNav'
import GlassCard from '@/components/GlassCard'
import Button from '@/components/Button'
import Grain from '@/components/Grain'
import Footer from '@/components/Footer'
import { TrashIcon } from '@/components/icons'
import { api, type Usuario, type GovConta, type Pagina } from '@/lib/api'

type Aba = 'usuarios' | 'gov' | 'paginas'

const ABAS: { id: Aba; label: string }[] = [
  { id: 'usuarios', label: 'Usuários' },
  { id: 'gov', label: 'Contas Gov' },
  { id: 'paginas', label: 'Páginas' },
]

export default function ContasPage() {
  const pronto = useRequireAuth()
  const [aba, setAba] = useState<Aba>('usuarios')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [contasGov, setContasGov] = useState<GovConta[]>([])
  const [paginas, setPaginas] = useState<Pagina[]>([])
  const [erro, setErro] = useState('')
  const [excluindo, setExcluindo] = useState<string | null>(null)

  function carregar() {
    setErro('')
    api.listarUsuarios().then((r) => setUsuarios(r.usuarios)).catch((e) => setErro(e.message))
    api.listarGovContas().then((r) => setContasGov(r.contas)).catch((e) => setErro(e.message))
    api.listarPaginas().then((r) => setPaginas(r.paginas)).catch((e) => setErro(e.message))
  }

  useEffect(() => {
    if (!pronto) return
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto])

  async function excluir(id: string) {
    if (!confirm('Excluir esta conta permanentemente? Essa ação não pode ser desfeita.')) return
    setExcluindo(id)
    try {
      await api.excluirConta(id)
      carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir conta')
    } finally {
      setExcluindo(null)
    }
  }

  if (!pronto) return null

  return (
    <>
      <Grain />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminNav atual="/contas" />
        <main style={{ flex: 1, maxWidth: '1080px', margin: '0 auto', padding: '0 1.5rem 3rem', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>Contas</h1>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {ABAS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.625rem',
                  border: '1px solid var(--c-divider)',
                  background: aba === a.id ? 'var(--c-glass-bg)' : 'transparent',
                  color: aba === a.id ? 'var(--c-text-1)' : 'var(--c-text-2)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>

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

          {aba === 'usuarios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {usuarios.length === 0 && <p style={{ color: 'var(--c-text-3)' }}>Nenhum usuário encontrado.</p>}
              {usuarios.map((u) => (
                <GlassCard key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>{u.nome}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>CPF: {u.cpf}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<TrashIcon />}
                    loading={excluindo === u.id}
                    onClick={() => excluir(u.id)}
                  >
                    Excluir
                  </Button>
                </GlassCard>
              ))}
            </div>
          )}

          {aba === 'gov' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {contasGov.length === 0 && <p style={{ color: 'var(--c-text-3)' }}>Nenhuma conta gov encontrada.</p>}
              {contasGov.map((c) => (
                <GlassCard key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>{c.nome}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
                      {c.orgao} · {c.cidade} · nível {c.nivel_acesso}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<TrashIcon />}
                    loading={excluindo === c.id}
                    onClick={() => excluir(c.id)}
                  >
                    Excluir
                  </Button>
                </GlassCard>
              ))}
            </div>
          )}

          {aba === 'paginas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {paginas.length === 0 && <p style={{ color: 'var(--c-text-3)' }}>Nenhuma página encontrada.</p>}
              {paginas.map((p) => (
                <GlassCard key={p.id} style={{ padding: '1rem 1.25rem' }}>
                  <p style={{ fontWeight: 700 }}>{p.nome}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
                    {p.tipo === 'privada' ? 'Privada' : 'Pública'}
                    {p.descricao ? ` · ${p.descricao}` : ''}
                  </p>
                </GlassCard>
              ))}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  )
}
