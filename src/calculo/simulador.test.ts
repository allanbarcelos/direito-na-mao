import { describe, expect, it } from 'vitest'
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

const soma = (r: ReturnType<typeof simular>, id: string) =>
  r.melhor.beneficios.filter((b) => b.programaId === id).reduce((s, b) => s + b.valorMensal, 0)

describe('Bolsa Família', () => {
  it('aplica o mínimo de R$ 691 para uma pessoa só', () => {
    expect(valorBolsaFamilia([pessoa()]).total).toBe(691)
  })

  it('soma renda de cidadania, primeira infância e variável', () => {
    const v = valorBolsaFamilia([
      pessoa({ gestante: true }), pessoa(), pessoa({ idade: 3 }), pessoa({ idade: 10 }),
    ])
    // 4×164 = 656 → complemento 35 → 691; +173 (criança 3a) +58×2 (gestante, 10a)
    expect(v.cidadania).toBe(656)
    expect(v.complemento).toBe(35)
    expect(v.total).toBe(691 + 173 + 116)
  })

  it('não entra com renda acima de R$ 218 por pessoa', () => {
    const r = simular(familia([pessoa({ rendaTrabalho: 500 }), pessoa()]))
    expect(soma(r, 'bolsa-familia')).toBe(0)
  })

  it('Regra de Proteção paga 50% para quem já recebe e ganhou até R$ 706 por pessoa', () => {
    const r = simular(familia([pessoa({ rendaTrabalho: 1000 }), pessoa()], { recebeBolsaFamilia: true }))
    const bf = r.melhor.beneficios.find((b) => b.programaId === 'bolsa-familia')
    expect(bf?.valorMensal).toBe(691 / 2)
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
    const r = simular(familia([pessoa({ idade: 70, aposentadoria: 1621 })]))
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

  it('prefere 1 BPC + Bolsa Família cheio a 2 BPCs', () => {
    const r = simular(familia(membros()))
    expect(r.melhor.bpcPara).toHaveLength(1)
    expect(soma(r, 'bpc')).toBe(1621)
    // 10×164 + 3×173 + 4×58 = 1640 + 519 + 232
    expect(soma(r, 'bolsa-familia')).toBe(2391)
    expect(soma(r, 'pe-de-meia')).toBe(500)
    expect(r.melhor.totalPermanente).toBe(1621 + 2391 + 500)
  })

  it('soma programa estadual compatível (MS Mais Social)', () => {
    const r = simular(familia(membros(), { uf: 'MS' }))
    expect(soma(r, 'ms-mais-social')).toBe(450)
    expect(r.melhor.totalPermanente).toBe(1621 + 2391 + 500 + 450)
  })

  it('em Goiás, compara com programas que excluem o Bolsa Família', () => {
    const r = simular(familia([pessoa({ responsavel: true }), pessoa({ idade: 2 })], { uf: 'GO' }))
    // Com BF: 691 + 173 = 864. Sem BF: Mães de Goiás 300. Deve ficar com o BF.
    expect(r.melhor.comBolsaFamilia).toBe(true)
    expect(r.alternativas.some((c) => c.beneficios.some((b) => b.programaId === 'go-maes-de-goias'))).toBe(true)
  })
})

describe('outros federais', () => {
  it('seguro-defeso para pescador, sem impedir o Bolsa Família', () => {
    const r = simular(familia([pessoa({ pescador: true }), pessoa()]))
    expect(soma(r, 'seguro-defeso')).toBeCloseTo(1621 * 4 / 12, 2)
    expect(soma(r, 'bolsa-familia')).toBe(691)
  })

  it('programas com status "confirmar" ficam fora da soma', () => {
    const r = simular(familia([pessoa(), pessoa({ idade: 16, escola: 'medio' })], { uf: 'SC' }))
    expect(soma(r, 'sc-bolsa-estudante')).toBe(0)
    expect(r.aConfirmar.some((b) => b.programaId === 'sc-bolsa-estudante')).toBe(true)
  })
})
