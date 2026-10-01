'use client'

import { useEffect, useState } from 'react'
import { api, type AdminLogado } from './api'

// Permissões do administrador logado, guardadas na sessão do navegador para
// o menu não piscar a cada troca de tela (o backend continua conferindo tudo).
const CHAVE = 'plura_admin_acesso'

function lerCache(): AdminLogado | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE)
    return bruto ? (JSON.parse(bruto) as AdminLogado) : null
  } catch {
    return null
  }
}

export function limparCacheAcesso() {
  try {
    sessionStorage.removeItem(CHAVE)
  } catch {
    // sem sessionStorage disponível
  }
}

export function useMeuAcesso(): AdminLogado | null {
  const [admin, setAdmin] = useState<AdminLogado | null>(null)
  useEffect(() => {
    setAdmin(lerCache())
    api
      .meuAcesso()
      .then(({ admin: a }) => {
        setAdmin(a)
        try {
          sessionStorage.setItem(CHAVE, JSON.stringify(a))
        } catch {
          // ignora
        }
      })
      .catch(() => {})
  }, [])
  return admin
}
