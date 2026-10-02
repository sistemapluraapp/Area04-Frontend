// Dados de localidade montados em tempo real (sem listas fixas no código):
// países pelos nomes que o navegador conhece, Brasil pelo IBGE e os demais
// países pelo backend (CountryStateCity). Tudo em cache na memória.

export interface Pais {
  codigo: string
  nome: string
}
export interface Estado {
  codigo: string
  nome: string
}

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
// Códigos que o navegador conhece mas não são países (blocos, uso reservado)
const NAO_PAISES = new Set(['EU', 'EZ', 'UN', 'QO', 'XA', 'XB', 'ZZ', 'AC', 'CP', 'CQ', 'DG', 'EA', 'IC', 'TA'])
let cachePaises: Pais[] | null = null

// Testa todas as combinações de duas letras e guarda as que o navegador
// reconhece como região (ISO 3166-1 alfa-2). Brasil sempre primeiro.
export function listarPaises(): Pais[] {
  if (cachePaises) return cachePaises
  const lista: Pais[] = []
  try {
    const nomes = new Intl.DisplayNames(['pt-BR'], { type: 'region', fallback: 'none' })
    for (const a of LETRAS)
      for (const b of LETRAS) {
        const codigo = a + b
        const nome = nomes.of(codigo)
        if (nome && nome !== codigo && !NAO_PAISES.has(codigo) && !/desconhecid/i.test(nome)) lista.push({ codigo, nome })
      }
  } catch {
    // navegador sem Intl.DisplayNames: fica só o Brasil
  }
  lista.sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'))
  const brasil = lista.find((p) => p.codigo === 'BR') ?? { codigo: 'BR', nome: 'Brasil' }
  cachePaises = [brasil, ...lista.filter((p) => p.codigo !== 'BR')]
  return cachePaises
}

export function nomePais(codigo: string | null | undefined): string {
  if (!codigo) return ''
  return listarPaises().find((p) => p.codigo === codigo)?.nome ?? codigo
}

const IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades'
const cache = new Map<string, Promise<unknown>>()

function memo<T>(chave: string, carregar: () => Promise<T>): Promise<T> {
  if (!cache.has(chave)) {
    const p = carregar().catch((e) => {
      cache.delete(chave)
      throw e
    })
    cache.set(chave, p)
  }
  return cache.get(chave) as Promise<T>
}

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export type BuscarBackend = <T>(caminho: string) => Promise<T>

export function carregarEstados(pais: string, backend: BuscarBackend): Promise<Estado[]> {
  return memo(`estados:${pais}`, async () => {
    if (pais === 'BR') {
      const dados = await json<{ sigla: string; nome: string }[]>(`${IBGE}/estados?orderBy=nome`)
      return dados.map((e) => ({ codigo: e.sigla, nome: e.nome }))
    }
    const r = await backend<{ estados: Estado[] }>(`/localidades/${pais}/estados`)
    return r.estados
  })
}

export function carregarCidades(pais: string, estado: string, backend: BuscarBackend): Promise<string[]> {
  return memo(`cidades:${pais}:${estado}`, async () => {
    if (pais === 'BR') {
      const dados = await json<{ nome: string }[]>(`${IBGE}/estados/${estado}/municipios?orderBy=nome`)
      return dados.map((m) => m.nome)
    }
    const r = await backend<{ cidades: { nome: string }[] }>(`/localidades/${pais}/estados/${encodeURIComponent(estado)}/cidades`)
    return r.cidades.map((c) => c.nome)
  })
}

// Busca no backend desta área (referência estável para os efeitos do seletor)
export const buscarLocalidade: BuscarBackend = (caminho) => import('./api').then(({ request }) => request(caminho))
