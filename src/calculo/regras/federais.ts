import { BPC, MEIO_SALARIO, PE_DE_MEIA, SALARIO_MINIMO } from '../../data/referencias'
import { brl } from '../../lib/formatar'
import type { Contexto, Regra } from '../tipos'
import { nomeDe } from './comum'

/** Duração média do defeso usada para estimar a média mensal (varia de 3 a 5 meses). */
export const MESES_DEFESO_ESTIMADOS = 4

const ate = (ctx: Contexto, limite: number) => ctx.rendaPorPessoa <= limite

const peDeMeia: Regra = {
  programaId: 'pe-de-meia',
  avaliar: (ctx) => {
    if (!ate(ctx, PE_DE_MEIA.limiteRenda) || ctx.n < 2) return []
    const anual = PE_DE_MEIA.incentivoMatricula + PE_DE_MEIA.parcelaFrequencia * PE_DE_MEIA.parcelasPorAno + PE_DE_MEIA.conclusaoPorAno
    return ctx.familia.pessoas.flatMap((p, i) =>
      p.escola !== 'medio' || p.idade < PE_DE_MEIA.idadeMin || p.idade > PE_DE_MEIA.idadeMax ? [] : [{
        valorMensal: anual / 12,
        frequencia: 'anual' as const,
        valorTexto: `até ${brl(anual)} por ano`,
        pessoa: nomeDe(p, i),
        motivo: 'Estuda no ensino médio público e a família está no CadÚnico com renda de até meio salário mínimo por pessoa.',
        avisos: [
          `${brl(PE_DE_MEIA.conclusaoPorAno)} por ano fica guardado e só pode ser sacado ao terminar o ensino médio.`,
          'Precisa de 80% de presença nas aulas. No 3º ano, mais R$ 200 por fazer o ENEM.',
        ],
      }])
  },
}

const gasDoPovo: Regra = {
  programaId: 'gas-do-povo',
  avaliar: (ctx) => !ate(ctx, MEIO_SALARIO) || ctx.n < 2 ? [] : [{
    valorMensal: 0,
    frequencia: 'produto',
    valorTexto: `${ctx.n >= 4 ? 6 : 4} botijões grátis por ano`,
    motivo: 'Família no CadÚnico com renda de até meio salário mínimo por pessoa.',
    avisos: ['Não é dinheiro: a família retira o botijão de 13 kg de graça em revendas credenciadas.'],
  }],
}

const tarifaSocial: Regra = {
  programaId: 'tarifa-social',
  avaliar: (ctx) => {
    const temBPC = ctx.bpcPara.size > 0 || ctx.familia.pessoas.some((p) => p.recebeBPC)
    if (!ate(ctx, MEIO_SALARIO) && !temBPC) return []
    return [{
      valorMensal: 0,
      frequencia: 'desconto',
      valorTexto: 'Luz grátis até 80 kWh por mês',
      motivo: temBPC ? 'Família com pessoa que recebe BPC.' : 'Família no CadÚnico com renda de até meio salário mínimo por pessoa.',
      avisos: ['Costuma entrar automático. Se não aparecer na conta de luz, ligue para a distribuidora com o NIS em mãos.'],
    }]
  },
}

const bolsaVerde: Regra = {
  programaId: 'bolsa-verde',
  avaliar: (ctx) => !ctx.familia.reservaOuAssentamento || !ate(ctx, MEIO_SALARIO) ? [] : [{
    valorMensal: 200,
    valorTexto: 'R$ 600 a cada 3 meses',
    motivo: 'Mora em reserva extrativista, floresta nacional, assentamento ou área parecida e tem renda baixa.',
    avisos: ['A família precisa ser indicada pelo ICMBio, INCRA ou órgão que cuida da área.'],
  }],
}

const garantiaSafra: Regra = {
  programaId: 'garantia-safra',
  avaliar: (ctx) => {
    const f = ctx.familia
    if (!f.semiarido || !f.pessoas.some((p) => p.agricultor) || ctx.rendaFamiliar > 1.5 * SALARIO_MINIMO) return []
    return [{
      valorMensal: 1200 / 12,
      frequencia: 'anual',
      valorTexto: 'R$ 1.200 se perder a safra',
      motivo: 'Agricultor familiar no semiárido com renda da família de até 1,5 salário mínimo.',
      avisos: ['Só paga se a cidade tiver perda de pelo menos 50% da safra.', 'É preciso aderir antes de plantar (contribuição de cerca de R$ 24).'],
    }]
  },
}

const seguroDefeso: Regra = {
  programaId: 'seguro-defeso',
  avaliar: (ctx) => ctx.familia.pessoas.flatMap((p, i) =>
    !p.pescador || p.recebeBPC || ctx.bpcPara.has(p.id) || p.aposentadoria > 0 ? [] : [{
      valorMensal: (SALARIO_MINIMO * MESES_DEFESO_ESTIMADOS) / 12,
      frequencia: 'sazonal' as const,
      valorTexto: `${brl(SALARIO_MINIMO)} por mês de defeso`,
      pessoa: nomeDe(p, i),
      motivo: 'Pescador artesanal: recebe nos meses em que a pesca é proibida.',
      avisos: [`A média mensal considera ${MESES_DEFESO_ESTIMADOS} meses de defeso por ano; varia conforme a espécie e a região.`, 'Precisa do Registro Geral da Pesca (RGP), CadÚnico e biometria.'],
    }]),
}

const auxilioInclusao: Regra = {
  programaId: 'auxilio-inclusao',
  avaliar: (ctx) => ctx.familia.pessoas.flatMap((p, i) =>
    !p.deficiencia || !p.saiuDoBPC || !p.trabalhoFormal || p.rendaTrabalho > 2 * SALARIO_MINIMO ? [] : [{
      valorMensal: BPC.valor / 2,
      valorTexto: `${brl(BPC.valor / 2)} por mês`,
      pessoa: nomeDe(p, i),
      motivo: 'Pessoa com deficiência que deixou o BPC para trabalhar com carteira ganhando até 2 salários mínimos.',
      avisos: ['Peça pelo Meu INSS ou pelo telefone 135.'],
    }]),
}

const pensaoZika: Regra = {
  programaId: 'pensao-zika',
  avaliar: (ctx) => ctx.familia.pessoas.flatMap((p, i) => !p.zika ? [] : [{
    nome: 'Pensão especial (Zika)',
    valorMensal: 0,
    valorTexto: 'Valor igual ao teto do INSS, por mês, para sempre',
    pessoa: nomeDe(p, i),
    motivo: 'Deficiência causada pela síndrome congênita do vírus Zika.',
    avisos: ['Também há indenização única de R$ 50.000.', 'Pode ser somada ao BPC.', 'O valor não entra na soma abaixo porque depende do teto do INSS do ano.'],
  }]),
}

const bolsaPermanencia: Regra = {
  programaId: 'bolsa-permanencia',
  avaliar: (ctx) => ctx.familia.pessoas.flatMap((p, i) =>
    p.escola !== 'faculdade' || !p.indigenaQuilombola ? [] : [{
      valorMensal: 1400,
      valorTexto: 'R$ 1.400 por mês',
      pessoa: nomeDe(p, i),
      motivo: 'Estudante indígena ou quilombola em universidade federal.',
      avisos: ['Pedido feito na própria universidade.'],
    }]),
}

/** Regras federais que não mudam a renda da família (BPC e Bolsa Família ficam à parte). */
export const REGRAS_FEDERAIS: Regra[] = [
  peDeMeia, gasDoPovo, tarifaSocial, bolsaVerde, garantiaSafra,
  seguroDefeso, auxilioInclusao, pensaoZika, bolsaPermanencia,
]
