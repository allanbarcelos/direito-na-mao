import { PROGRAMAS_ESTADUAIS } from '../data/programasEstaduais'
import type { Status } from '../data/tipos'
import type { Contexto } from './simulador'
import type { BeneficioCalculado } from './tipos'

export function avaliarEstaduais(ctx: Contexto): { status: Status; beneficio: BeneficioCalculado }[] {
  if (!ctx.familia.uf) return []
  return PROGRAMAS_ESTADUAIS
    .filter((p) => p.uf === ctx.familia.uf)
    .flatMap((p) => p.avaliar(ctx).map((a) => ({
      status: p.status,
      beneficio: {
        programaId: p.id,
        nome: p.nome,
        icone: p.icone,
        esfera: 'estadual' as const,
        valorMensal: Math.round(a.valorMensal * 100) / 100,
        frequencia: a.frequencia ?? 'mensal',
        valorTexto: a.valorTexto,
        pessoa: a.pessoa,
        motivo: a.motivo,
        avisos: [
          ...(a.avisos ?? []),
          ...(p.acumulaBolsaFamilia === 'incerto' ? ['Não achamos regra oficial dizendo se pode somar com o Bolsa Família.'] : []),
        ],
        temporario: a.temporario,
      },
    })))
}
