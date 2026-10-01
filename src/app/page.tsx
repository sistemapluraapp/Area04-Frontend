'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { estaLogado } from '@/lib/auth'
import { useTituloPagina } from '@/lib/useTituloPagina'

export default function HomePage() {
  useTituloPagina('Administração')
  const router = useRouter()

  useEffect(() => {
    router.replace(estaLogado() ? '/dashboard' : '/login')
  }, [router])

  return null
}
