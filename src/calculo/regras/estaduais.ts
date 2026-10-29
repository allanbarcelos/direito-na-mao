import { PROGRAMAS_ESTADUAIS } from '../../data/programasEstaduais'
import type { UF } from '../../data/tipos'
import type { Regra } from '../tipos'

/** Regras dos programas do estado (cada programa estadual traz a sua). */
export function regrasDoEstado(uf: UF | ''): Regra[] {
  if (!uf) return []
  return PROGRAMAS_ESTADUAIS
    .filter((p) => p.uf === uf)
    .map((p) => ({ programaId: p.id, avaliar: p.avaliar }))
}
