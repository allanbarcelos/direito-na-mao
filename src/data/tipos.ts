export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export type UF = (typeof UFS)[number]

export const NOMES_UF: Record<UF, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
}

/** Uma referência oficial (lei, decreto, portaria ou página de órgão público). */
export interface Fonte {
  titulo: string
  url: string
  orgao: string
  /** Data da publicação ou da consulta, no formato AAAA-MM-DD. */
  data?: string
}

/**
 * dinheiro: cai na conta ou no cartão todo mês
 * poupanca: parte fica guardada (ex.: Pé-de-Meia)
 * produto: recebe a coisa em si (botijão, cesta)
 * desconto: abatimento em conta (luz)
 * trabalhista: depende de emprego ou atividade (não é assistência social)
 */
export type Categoria = 'dinheiro' | 'poupanca' | 'produto' | 'desconto' | 'trabalhista'

/**
 * ativo: confirmado em fonte oficial com pagamentos recentes
 * confirmar: existe em lei, mas não achamos prova de pagamento recente — não entra na soma
 */
export type Status = 'ativo' | 'confirmar'

export type Acumula = 'sim' | 'nao' | 'incerto'

export interface Programa {
  id: string
  nome: string
  esfera: 'federal' | 'estadual'
  uf?: UF
  categoria: Categoria
  icone: string
  /** Uma frase curta, em linguagem simples. */
  resumo: string
  valorTexto: string
  paraQuem: string[]
  regras: string[]
  comoPedir: string[]
  /** Ids de LOCAIS (onde ir). */
  onde: string[]
  acumulaBolsaFamilia: Acumula
  status: Status
  observacao?: string
  fontes: Fonte[]
  /** Quando conferimos os dados pela última vez (AAAA-MM-DD). */
  conferido: string
}

export interface Local {
  id: string
  nome: string
  icone: string
  oQueE: string
  comoAchar: string
  telefone?: string
  link?: string
}
