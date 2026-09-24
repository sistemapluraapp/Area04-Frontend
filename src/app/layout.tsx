import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SCRIPT_MODO_INICIAL } from '@/lib/modo'
import { SCRIPT_ACESSIBILIDADE_INICIAL } from '@/lib/acessibilidade'
import MarcaDagua from '@/components/MarcaDagua'
import VLibras from '@/components/VLibras'

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
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ACESSIBILIDADE_INICIAL }} />
      </head>
      <body>
        <a href="#conteudo" className="pular-conteudo">
          Pular para o conteúdo
        </a>
        <MarcaDagua />
        {children}
        <VLibras />
      </body>
    </html>
  )
}
