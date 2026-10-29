import { programaPorId } from '../../data/catalogo'
import type { Status } from '../../data/tipos'
import type { Avaliacao, BeneficioCalculado, Contexto, Regra } from '../tipos'

export interface BeneficioComStatus {
  status: Status
  beneficio: BeneficioCalculado
}

const AVISO_ACUMULO = 'Não achamos regra oficial dizendo se pode somar com o Bolsa Família.'

/** Junta o resultado de uma regra com os dados do programa no catálogo. */
export function criarBeneficio(programaId: string, a: Avaliacao): BeneficioComStatus {
  const p = programaPorId(programaId)
  if (!p) throw new Error(`Programa sem cadastro no catálogo: ${programaId}`)
  return {
    status: p.status,
    beneficio: {
      programaId,
      nome: a.nome ?? p.nome,
      icone: p.icone,
      esfera: p.esfera,
      valorMensal: Math.round(a.valorMensal * 100) / 100,
      frequencia: a.frequencia ?? 'mensal',
      valorTexto: a.valorTexto,
      pessoa: a.pessoa,
      motivo: a.motivo,
      avisos: [...(a.avisos ?? []), ...(p.acumulaBolsaFamilia === 'incerto' ? [AVISO_ACUMULO] : [])],
      temporario: a.temporario,
    },
  }
}

export function aplicarRegras(regras: Regra[], ctx: Contexto): BeneficioComStatus[] {
  return regras.flatMap((r) => r.avaliar(ctx).map((a) => criarBeneficio(r.programaId, a)))
}
