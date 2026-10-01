'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { estaLogado } from '@/lib/auth'
import { destinoInicial } from '@/lib/destinoInicial'
import { useTituloPagina } from '@/lib/useTituloPagina'

export default function HomePage() {
  useTituloPagina('Administração')
  const router = useRouter()

  useEffect(() => {
    if (!estaLogado()) return router.replace('/login')
    api
      .meuAcesso()
      .then(({ admin }) => router.replace(destinoInicial(admin)))
      .catch(() => router.replace('/login'))
  }, [router])

  return null
}
