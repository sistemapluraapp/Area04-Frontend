'use client'

import PainelAcessibilidade from './PainelAcessibilidade'

// Botão de Acessibilidade para telas sem cabeçalho (login, cadastro, convite).
export default function AcessoRapido() {
  return (
    <div style={{ position: 'fixed', top: 'calc(1rem + env(safe-area-inset-top, 0px))', right: '1rem', zIndex: 50 }}>
      <PainelAcessibilidade />
    </div>
  )
}
