import { PROGRAMAS_ESTADUAIS } from './programasEstaduais'
import { PROGRAMAS_FEDERAIS } from './programasFederais'
import type { Programa } from './tipos'

/** Todos os programas (fonte única de nome, ícone, regras de texto e fontes). */
export const PROGRAMAS: Programa[] = [...PROGRAMAS_FEDERAIS, ...PROGRAMAS_ESTADUAIS]

const POR_ID = new Map(PROGRAMAS.map((p) => [p.id, p]))

export function programaPorId(id: string): Programa | undefined {
  return POR_ID.get(id)
}
