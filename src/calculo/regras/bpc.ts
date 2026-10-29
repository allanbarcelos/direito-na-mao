import { BPC, SALARIO_MINIMO } from '../../servicos/referencias'
import { brl } from '../../lib/formatar'
import type { Familia, Pessoa, Regra } from '../tipos'
import { nomeDe } from './comum'

/** Pode pedir BPC: 65+ ou deficiência, sem aposentadoria/pensão e sem já receber. */
export function podePedirBPC(p: Pessoa): boolean {
  return (p.idade >= BPC.idadeMinima || p.deficiencia) && p.aposentadoria === 0 && !p.recebeBPC
}

/**
 * Teste de renda do BPC (1/4 do salário mínimo por pessoa).
 * Pela LOAS (art. 20 §14), BPC ou aposentadoria de até 1 salário mínimo de outro
 * idoso ou pessoa com deficiência da família não entra na conta.
 */
export function passaRendaBPC(f: Familia, candidato: Pessoa): boolean {
  let renda = 0
  for (const p of f.pessoas) {
    renda += p.rendaTrabalho
    if (p.id === candidato.id) continue
    const protegido = (p.idade >= BPC.idadeMinima || p.deficiencia) && p.aposentadoria <= SALARIO_MINIMO
    if (!protegido) renda += p.aposentadoria
  }
  return renda / f.pessoas.length <= BPC.limiteRenda
}

/** Quem já recebe BPC e quem vai pedir neste cenário. */
export const REGRA_BPC: Regra = {
  programaId: 'bpc',
  avaliar: (ctx) => ctx.familia.pessoas.flatMap((p, i) => {
    if (!p.recebeBPC && !ctx.bpcPara.has(p.id)) return []
    return [{
      valorMensal: BPC.valor,
      valorTexto: `${brl(BPC.valor)} por mês`,
      pessoa: nomeDe(p, i),
      motivo: p.idade >= BPC.idadeMinima ? 'Tem 65 anos ou mais e renda baixa.' : 'Tem deficiência e renda baixa.',
      avisos: p.recebeBPC ? ['Já recebe — mantenha o CadÚnico atualizado a cada 2 anos.'] : [
        'Precisa passar por avaliação no INSS (e perícia, no caso de deficiência).',
        'Não pode ser somado com aposentadoria ou pensão.',
      ],
    }]
  }),
}
