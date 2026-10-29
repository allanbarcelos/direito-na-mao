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

/** Tipos do "banco" (src/dados): definidos uma vez no esquema e reaproveitados aqui. */
export type { Fonte, Programa } from '../dados/esquema'
import type { Locais, Programa } from '../dados/esquema'

/**
 * dinheiro: cai na conta ou no cartão todo mês
 * poupanca: parte fica guardada (ex.: Pé-de-Meia)
 * produto: recebe a coisa em si (botijão, cesta)
 * desconto: abatimento em conta (luz)
 * trabalhista: depende de emprego ou atividade (não é assistência social)
 */
export type Categoria = Programa['categoria']

/**
 * ativo: confirmado em fonte oficial com pagamentos recentes
 * confirmar: existe em lei, mas não achamos prova de pagamento recente — não entra na soma
 */
export type Status = Programa['status']

export type Acumula = Programa['acumulaBolsaFamilia']

export type Local = Locais['locais'][number]
