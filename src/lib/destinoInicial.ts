import type { AdminLogado } from './api'

// Primeira tela que o administrador pode abrir, na ordem do menu
const TELAS: { href: string; permissao: string }[] = [
  { href: '/dashboard', permissao: 'indicadores' },
  { href: '/comentarios', permissao: 'moderacao' },
  { href: '/certificados', permissao: 'certificados' },
  { href: '/contas', permissao: 'contas' },
  { href: '/comunicacao', permissao: 'comunicacao' },
  { href: '/acessibilidade', permissao: 'configuracoes' },
  { href: '/administradores', permissao: 'administradores' },
]

export function destinoInicial(admin: AdminLogado | null | undefined): string {
  return TELAS.find((t) => admin?.permissoes.includes(t.permissao))?.href ?? '/dashboard'
}
