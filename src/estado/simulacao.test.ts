import { describe, expect, it } from 'vitest'
import { alterarPessoa, definirModo, definirQuantidade, simulacaoVazia } from './simulacao'

describe('estado da simulação', () => {
  it('"só para mim" deixa uma pessoa; "família" garante pelo menos duas', () => {
    const familia = definirModo(simulacaoVazia(), 'familia')
    expect(familia.familia.pessoas).toHaveLength(2)
    expect(definirModo(definirQuantidade(familia, 5), 'eu').familia.pessoas).toHaveLength(1)
  })

  it('aumentar a quantidade preserva quem já foi preenchido', () => {
    const s = alterarPessoa(simulacaoVazia(), 0, { nome: 'Ana', idade: 40 })
    const maior = definirQuantidade(s, 3)
    expect(maior.familia.pessoas).toHaveLength(3)
    expect(maior.familia.pessoas[0]).toMatchObject({ nome: 'Ana', idade: 40 })
    expect(new Set(maior.familia.pessoas.map((p) => p.id)).size).toBe(3)
  })

  it('não altera o objeto original (imutável)', () => {
    const s = simulacaoVazia()
    alterarPessoa(s, 0, { idade: 99 })
    expect(s.familia.pessoas[0].idade).toBe(30)
  })
})
