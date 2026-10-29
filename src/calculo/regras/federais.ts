import { PROGRAMAS_FEDERAIS } from '../../servicos/catalogo'
import type { Regra } from '../tipos'
import { regraDe } from './interpretador'

/**
 * Regras federais vindas do JSON. BPC e Bolsa Família ficam fora: mudam a renda
 * da família e são usados pelos outros programas, por isso têm código próprio.
 */
export const REGRAS_FEDERAIS: Regra[] = PROGRAMAS_FEDERAIS
  .map(regraDe)
  .filter((r): r is Regra => r !== null)
