import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plura — Admin',
  description: 'Painel administrativo interno — Plura',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
