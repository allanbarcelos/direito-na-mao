import type { Gastos } from '../dados/esquema'
import json from '../dados/gastos.json'

const gastos = json as Gastos

export type MesBolsaFamilia = Gastos['bolsaFamiliaMensal'][number]
export type Destaque = Gastos['destaques'][number]

/** Folhas mensais do Bolsa Família com total divulgado oficialmente. */
export const BOLSA_FAMILIA_MENSAL: MesBolsaFamilia[] = gastos.bolsaFamiliaMensal

export const TOTAL_BF_DIVULGADO = BOLSA_FAMILIA_MENSAL.reduce((s, m) => s + m.total, 0)

/** Destaques marcados como "calculado" são a soma das folhas mensais acima. */
export const DESTAQUES: Destaque[] = gastos.destaques.map((d) =>
  d.calculado ? { ...d, valor: TOTAL_BF_DIVULGADO } : d,
)

export const NUMEROS = gastos.numeros
