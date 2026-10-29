import { describe, expect, it } from 'vitest'
import { programaPorId } from '../servicos/catalogo'
import { BOLSA_FAMILIA as BF, SALARIO_MINIMO as SM } from '../servicos/referencias'
import { resolver } from './regras/interpretador'
import { passaRendaBPC, simular, valorBolsaFamilia } from './simulador'
import type { Familia, Pessoa } from './tipos'

let seq = 0
function pessoa(p: Partial<Pessoa> = {}): Pessoa {
  return {
    id: `p${++seq}`, nome: '', idade: 30, deficiencia: false, zika: false, gestante: false,
    amamentando: false, escola: 'nao', integral: false, rendaTrabalho: 0, trabalhoFormal: false,
    aposentadoria: 0, recebeBPC: false, saiuDoBPC: false, pescador: false, agricultor: false,
    indigenaQuilombola: false, responsavel: false, ...p,
  }
}

function familia(pessoas: Pessoa[], f: Partial<Familia> = {}): Familia {
  return { uf: '', pessoas, semiarido: false, reservaOuAssentamento: false, recebeBolsaFamilia: false, cadUnico: 'sim', ...f }
}

/** Valor mensal de um programa do JSON (os testes não fixam valores que mudam com reajustes). */
const valorDe = (id: string) => resolver(programaPorId(id)!.calculo!.valor)

const soma = (r: ReturnType<typeof simular>, id: string) =>
  r.melhor.beneficios.filter((b) => b.programaId === id).reduce((s, b) => s + b.valorMensal, 0)

describe('Bolsa Família', () => {
  it('aplica o valor mínimo por família para uma pessoa só', () => {
    expect(valorBolsaFamilia([pessoa()]).total).toBe(BF.minimoFamilia)
  })

  it('soma renda de cidadania, primeira infância e variável', () => {
    const v = valorBolsaFamilia([
      pessoa({ gestante: true }), pessoa(), pessoa({ idade: 3 }), pessoa({ idade: 10 }),
    ])
    // 4 × renda de cidadania, completa até o mínimo; + primeira infância (3 anos) + variável × 2 (gestante, 10 anos)
    expect(v.cidadania).toBe(4 * BF.rendaCidadania)
    expect(v.complemento).toBe(Math.max(0, BF.minimoFamilia - 4 * BF.rendaCidadania))
    expect(v.total).toBe(Math.max(BF.minimoFamilia, 4 * BF.rendaCidadania) + BF.primeiraInfancia + 2 * BF.variavelFamiliar)
  })

  it('não entra com renda acima da linha de entrada', () => {
    const r = simular(familia([pessoa({ rendaTrabalho: 2 * BF.linhaEntrada + 10 }), pessoa()]))
    expect(soma(r, 'bolsa-familia')).toBe(0)
  })

  it('Regra de Proteção paga parte do valor para quem já recebe e passou da linha', () => {
    const r = simular(familia([pessoa({ rendaTrabalho: BF.linhaEntrada + BF.protecaoLimite }), pessoa()], { recebeBolsaFamilia: true }))
    const bf = r.melhor.beneficios.find((b) => b.programaId === 'bolsa-familia')
    expect(bf?.valorMensal).toBe(BF.minimoFamilia * BF.protecaoPercentual)
    expect(bf?.temporario).toBeTruthy()
  })
})

describe('BPC', () => {
  it('ignora BPC de outro idoso no teste de renda (LOAS art. 20 §14)', () => {
    const avo = pessoa({ idade: 70, recebeBPC: true })
    const avoh = pessoa({ idade: 68 })
    expect(passaRendaBPC(familia([avo, avoh]), avoh)).toBe(true)
  })

  it('não oferece BPC para quem já é aposentado', () => {
    const r = simular(familia([pessoa({ idade: 70, aposentadoria: SM })]))
    expect(soma(r, 'bpc')).toBe(0)
  })
})

describe('otimização: família grande do exemplo', () => {
  // 2 adultos (mãe gestante), 3 crianças 0–6, 3 jovens 7–17 (2 no ensino médio),
  // 1 idoso e 1 adulto com deficiência — 10 pessoas, sem outra renda.
  const membros = () => [
    pessoa({ gestante: true, responsavel: true }), pessoa(),
    pessoa({ idade: 1 }), pessoa({ idade: 3 }), pessoa({ idade: 5 }),
    pessoa({ idade: 10 }), pessoa({ idade: 15, escola: 'medio' }), pessoa({ idade: 16, escola: 'medio' }),
    pessoa({ idade: 70 }), pessoa({ idade: 40, deficiencia: true }),
  ]

  // 10 × cidadania + 3 crianças de 0 a 6 + 4 variáveis (gestante e 3 jovens de 7 a 17)
  const BF_EXEMPLO = 10 * BF.rendaCidadania + 3 * BF.primeiraInfancia + 4 * BF.variavelFamiliar
  const PE_DE_MEIA_EXEMPLO = 2 * valorDe('pe-de-meia') / 12

  it('prefere 1 BPC + Bolsa Família cheio a 2 BPCs', () => {
    const r = simular(familia(membros()))
    expect(r.melhor.bpcPara).toHaveLength(1)
    expect(soma(r, 'bpc')).toBe(SM)
    expect(soma(r, 'bolsa-familia')).toBe(BF_EXEMPLO)
    expect(soma(r, 'pe-de-meia')).toBe(PE_DE_MEIA_EXEMPLO)
    expect(r.melhor.totalPermanente).toBe(SM + BF_EXEMPLO + PE_DE_MEIA_EXEMPLO)
  })

  it('soma programa estadual compatível (MS Mais Social)', () => {
    const r = simular(familia(membros(), { uf: 'MS' }))
    expect(soma(r, 'ms-mais-social')).toBe(valorDe('ms-mais-social'))
    expect(r.melhor.totalPermanente).toBe(SM + BF_EXEMPLO + PE_DE_MEIA_EXEMPLO + valorDe('ms-mais-social'))
  })

  it('em Goiás, compara com programas que excluem o Bolsa Família', () => {
    const r = simular(familia([pessoa({ responsavel: true }), pessoa({ idade: 2 })], { uf: 'GO' }))
    // Com BF: mínimo + primeira infância. Sem BF: Mães de Goiás. Deve ficar com o BF.
    expect(r.melhor.comBolsaFamilia).toBe(true)
    expect(r.alternativas.some((c) => c.beneficios.some((b) => b.programaId === 'go-maes-de-goias'))).toBe(true)
  })
})

describe('outros federais', () => {
  it('seguro-defeso para pescador, sem impedir o Bolsa Família', () => {
    const r = simular(familia([pessoa({ pescador: true }), pessoa()]))
    expect(soma(r, 'seguro-defeso')).toBeCloseTo(SM * 4 / 12, 2)
    expect(soma(r, 'bolsa-familia')).toBe(BF.minimoFamilia)
  })

  it('programas com status "confirmar" ficam fora da soma', () => {
    const r = simular(familia([pessoa(), pessoa({ idade: 16, escola: 'medio' })], { uf: 'SC' }))
    expect(soma(r, 'sc-bolsa-estudante')).toBe(0)
    expect(r.aConfirmar.some((b) => b.programaId === 'sc-bolsa-estudante')).toBe(true)
  })
})
