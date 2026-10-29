import type { Programa } from '../dados/esquema'
import json from '../dados/programas.json'
import { UFS, type UF } from './tipos'

/** Todos os programas, lidos de src/dados/programas.json (fonte única de verdade). */
export const PROGRAMAS: Programa[] = (json as { programas: Programa[] }).programas

export const PROGRAMAS_FEDERAIS = PROGRAMAS.filter((p) => p.esfera === 'federal')
export const PROGRAMAS_ESTADUAIS = PROGRAMAS.filter((p) => p.esfera === 'estadual')

const POR_ID = new Map(PROGRAMAS.map((p) => [p.id, p]))

export function programaPorId(id: string): Programa | undefined {
  return POR_ID.get(id)
}

export function programasDoEstado(uf: UF): Programa[] {
  return PROGRAMAS_ESTADUAIS.filter((p) => p.uf === uf)
}

/** Estados sem nenhum programa estadual ativo cadastrado. */
export const ESTADOS_SEM_PROGRAMA: UF[] = UFS.filter(
  (uf) => !PROGRAMAS_ESTADUAIS.some((p) => p.uf === uf && p.status === 'ativo'),
)
