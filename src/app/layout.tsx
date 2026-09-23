import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SCRIPT_MODO_INICIAL } from '@/lib/modo'
import MarcaDagua from '@/components/MarcaDagua'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans-loaded' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono-loaded' })

export const metadata: Metadata = {
  title: 'Plura — Admin',
  description: 'Painel administrativo interno — Plura',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_MODO_INICIAL }} />
      </head>
      <body>
        <MarcaDagua />
        {children}
      </body>
    </html>
  )
}
