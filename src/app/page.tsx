'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { estaLogado } from '@/lib/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(estaLogado() ? '/dashboard' : '/login')
  }, [router])

  return null
}
