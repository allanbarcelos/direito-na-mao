import { BOLSA_FAMILIA } from '../../servicos/referencias'
import { brl } from '../../lib/formatar'
import type { Avaliacao, Familia, Pessoa } from '../tipos'

/** Valor cheio do Bolsa Família para a composição da família. */
export function valorBolsaFamilia(pessoas: Pessoa[]) {
  const cidadania = pessoas.length * BOLSA_FAMILIA.rendaCidadania
  const complemento = Math.max(0, BOLSA_FAMILIA.minimoFamilia - cidadania)
  const criancas = pessoas.filter((p) => p.idade < 7).length
  const variaveis = pessoas.filter(
    (p) => p.gestante || p.amamentando || (p.idade >= 7 && p.idade < 18),
  ).length
  const primeiraInfancia = criancas * BOLSA_FAMILIA.primeiraInfancia
  const variavel = variaveis * BOLSA_FAMILIA.variavelFamiliar
  return {
    total: cidadania + complemento + primeiraInfancia + variavel,
    cidadania, complemento, primeiraInfancia, variavel,
  }
}

/**
 * Bolsa Família de um cenário. Fica fora da lista de regras porque o valor dele
 * entra no contexto usado pelos outros programas (alguns estaduais contam o BF).
 */
export function avaliarBolsaFamilia(f: Familia, rendaPorPessoa: number): { valor: number; avaliacao?: Avaliacao } {
  const v = valorBolsaFamilia(f.pessoas)
  const n = f.pessoas.length

  if (rendaPorPessoa <= BOLSA_FAMILIA.linhaEntrada) {
    const partes = [
      `${n} × ${brl(BOLSA_FAMILIA.rendaCidadania)} por pessoa`,
      v.complemento > 0 ? `complemento de ${brl(v.complemento)} até o mínimo de ${brl(BOLSA_FAMILIA.minimoFamilia)}` : '',
      v.primeiraInfancia > 0 ? `${brl(v.primeiraInfancia)} pelas crianças de 0 a 6 anos` : '',
      v.variavel > 0 ? `${brl(v.variavel)} por gestantes, quem amamenta e jovens de 7 a 17` : '',
    ].filter(Boolean)
    return {
      valor: v.total,
      avaliacao: {
        valorMensal: v.total,
        valorTexto: `${brl(v.total)} por mês`,
        motivo: `Renda de ${brl(rendaPorPessoa)} por pessoa (limite ${brl(BOLSA_FAMILIA.linhaEntrada)}). Conta: ${partes.join(' + ')}.`,
        avisos: [
          'Precisa manter vacinas, pré-natal e frequência escolar das crianças em dia.',
          ...(n === 1 ? ['Famílias de uma pessoa só passam por análise extra antes de entrar.'] : []),
        ],
      },
    }
  }

  if (f.recebeBolsaFamilia && rendaPorPessoa <= BOLSA_FAMILIA.protecaoLimite) {
    const metade = Math.round(v.total * BOLSA_FAMILIA.protecaoPercentual * 100) / 100
    return {
      valor: metade,
      avaliacao: {
        nome: 'Bolsa Família (Regra de Proteção)',
        valorMensal: metade,
        valorTexto: `${brl(metade)} por mês`,
        motivo: `A renda subiu para ${brl(rendaPorPessoa)} por pessoa, mas como a família já recebe, continua com metade do valor.`,
        avisos: ['Se a renda nova for aposentadoria, pensão ou BPC de idoso, a proteção pode durar só 2 meses.'],
        temporario: `até ${BOLSA_FAMILIA.protecaoMeses} meses`,
      },
    }
  }

  return { valor: 0 }
}
