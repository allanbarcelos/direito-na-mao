import { programasDoEstado } from '../../servicos/catalogo'
import type { UF } from '../../servicos/tipos'
import type { Regra } from '../tipos'
import { regraDe } from './interpretador'

/** Regras dos programas do estado escolhido, vindas do JSON. */
export function regrasDoEstado(uf: UF | ''): Regra[] {
  if (!uf) return []
  return programasDoEstado(uf).map(regraDe).filter((r): r is Regra => r !== null)
}
