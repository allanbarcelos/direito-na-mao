import { describe, expect, it } from 'vitest'
import type { Calculo } from '../../dados/esquema'
import { SALARIO_MINIMO } from '../../servicos/referencias'
import type { Contexto, Pessoa } from '../tipos'
import { avaliarCalculo, resolver } from './interpretador'

let seq = 0
const pessoa = (p: Partial<Pessoa> = {}): Pessoa => ({
  id: `i${++seq}`, nome: '', idade: 30, sexo: '', deficiencia: false, zika: false, gestante: false,
  amamentando: false, escola: 'nao', integral: false, rendaTrabalho: 0, trabalhoFormal: false,
  aposentadoria: 0, recebeBPC: false, saiuDoBPC: false, pescador: false, agricultor: false,
  indigenaQuilombola: false, responsavel: false, ...p,
})

function ctx(pessoas: Pessoa[], parcial: Partial<Contexto> = {}): Contexto {
  return {
    familia: { uf: '', pessoas, semiarido: false, reservaOuAssentamento: false, recebeBolsaFamilia: false, cadUnico: 'sim' },
    n: pessoas.length, rendaFamiliar: 0, rendaPorPessoa: 0, bolsaFamilia: 0, recebeBolsaFamilia: false,
    bpcPara: new Set(), ...parcial,
  }
}

describe('interpretador de regras do JSON', () => {
  it('resolve frações do salário mínimo', () => {
    expect(resolver({ sm: 0.5 })).toBe(SALARIO_MINIMO / 2)
    expect(resolver(100)).toBe(100)
  })

  it('família: valor base + adicionais, descontando os primeiros', () => {
    const c: Calculo = {
      tipo: 'familia', valor: 150, motivo: 'm',
      adicionais: [{ por: { escola: ['fundamental', 'medio'] }, valor: 50, descontar: 1 }],
    }
    const r = avaliarCalculo(c, ctx([pessoa({ escola: 'medio' }), pessoa({ escola: 'fundamental' }), pessoa({ escola: 'medio' })]))
    expect(r[0].valorMensal).toBe(250)
  })

  it('por pessoa: valor integral, limite de pessoas e média por pagamentos no ano', () => {
    const c: Calculo = {
      tipo: 'porPessoa', valor: 120, valorIntegral: 240, pagamentosPorAno: 10, maxPessoas: 2,
      pessoas: { escola: ['medio'] }, motivo: 'm',
    }
    const r = avaliarCalculo(c, ctx([
      pessoa({ escola: 'medio', integral: true }), pessoa({ escola: 'medio' }), pessoa({ escola: 'medio' }),
    ]))
    expect(r.map((a) => a.valorMensal)).toEqual([200, 100])
    expect(r[0].valorTexto).toBe('R$ 240 por mês')
  })

  it('"qualquer" escolhe o primeiro ramo que vale e usa o motivo dele', () => {
    const c: Calculo = {
      tipo: 'familia', valor: 0, semValor: true, motivo: 'padrão',
      requisitos: { qualquer: [{ temBPC: true, motivo: 'tem BPC' }, { rendaPorPessoaMax: 100, motivo: 'renda baixa' }] },
    }
    const comBPC = ctx([pessoa({ recebeBPC: true })], { rendaPorPessoa: 50 })
    expect(avaliarCalculo(c, comBPC)[0].motivo).toBe('tem BPC')
    expect(avaliarCalculo(c, ctx([pessoa()], { rendaPorPessoa: 500 }))).toEqual([])
  })

  it('filtra por sexo quando o programa pede', () => {
    const c: Calculo = { tipo: 'familia', valor: 300, motivo: 'm', requisitos: { alguem: [{ sexo: 'feminino', responsavel: true }] } }
    expect(avaliarCalculo(c, ctx([pessoa({ sexo: 'feminino', responsavel: true })]))).toHaveLength(1)
    expect(avaliarCalculo(c, ctx([pessoa({ sexo: 'masculino', responsavel: true })]))).toHaveLength(0)
    expect(avaliarCalculo(c, ctx([pessoa({ responsavel: true })]))).toHaveLength(0)
  })

  it('respeita exigir ou excluir o Bolsa Família', () => {
    const exige: Calculo = { tipo: 'familia', valor: 10, motivo: 'm', requisitos: { bolsaFamilia: 'exige' } }
    const exclui: Calculo = { tipo: 'familia', valor: 10, motivo: 'm', requisitos: { bolsaFamilia: 'exclui' } }
    const comBF = ctx([pessoa()], { recebeBolsaFamilia: true })
    expect(avaliarCalculo(exige, comBF)).toHaveLength(1)
    expect(avaliarCalculo(exclui, comBF)).toHaveLength(0)
  })

  it('preenche {valor} e {n} nos textos', () => {
    const c: Calculo = { tipo: 'porPessoaDaFamilia', valor: 10.5, motivo: '{n} pessoas', texto: '{valor} no total' }
    const [a] = avaliarCalculo(c, ctx([pessoa(), pessoa()]))
    expect(a.motivo).toBe('2 pessoas')
    expect(a.valorTexto).toBe('R$ 21 no total')
  })
})
