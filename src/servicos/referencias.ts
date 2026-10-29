import type { Referencias } from '../dados/esquema'
import json from '../dados/referencias.json'
import type { Fonte } from './tipos'

const ref = json as Referencias

/** Data em que os valores foram conferidos nas fontes oficiais. */
export const DATA_ATUALIZACAO = ref.dataAtualizacao
export const SALARIO_MINIMO = ref.salarioMinimo
export const MEIO_SALARIO = SALARIO_MINIMO / 2
export const TETO_INSS = ref.tetoInss
export const BOLSA_FAMILIA = ref.bolsaFamilia

export const BPC = {
  valor: SALARIO_MINIMO,
  limiteRenda: SALARIO_MINIMO * ref.bpc.fracaoRenda,
  idadeMinima: ref.bpc.idadeMinima,
}

export const FONTES_REFERENCIA: Fonte[] = ref.fontes
