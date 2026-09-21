'use client'

import type { AuthResponse } from './api'

const TOKEN_KEY = 'plura_admin_token'
const USER_KEY = 'plura_admin_user'
const REFRESH_KEY = 'plura_admin_refresh_token'

export function salvarSessao(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.access_token)
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
  localStorage.setItem(REFRESH_KEY, auth.refresh_token)
}

export function limparSessao() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function obterUsuarioSalvo(): AuthResponse['user'] | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function obterRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY)
}

export function estaLogado(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_KEY)
}
