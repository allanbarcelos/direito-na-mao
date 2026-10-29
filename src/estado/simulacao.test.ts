import { beforeEach, describe, expect, it, vi } from 'vitest'
import { alterarPessoa, carregarSimulacao, definirModo, definirQuantidade, simulacaoVazia } from './simulacao'

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

  describe('simulação salva antes da pergunta sobre sexo', () => {
    beforeEach(() => {
      const antiga = simulacaoVazia()
      const semSexo = antiga.familia.pessoas.map(({ sexo: _sexo, ...resto }) => resto)
      const salvo = JSON.stringify({ ...antiga, familia: { ...antiga.familia, pessoas: [
        { ...semSexo[0], gestante: true }, { ...semSexo[0], id: 'b' },
      ] } })
      vi.stubGlobal('localStorage', { getItem: () => salvo, setItem: () => {}, removeItem: () => {} })
    })

    it('grávida vira feminino; o resto fica sem resposta', () => {
      const s = carregarSimulacao()
      expect(s.familia.pessoas.map((p) => p.sexo)).toEqual(['feminino', ''])
    })
  })

  it('não altera o objeto original (imutável)', () => {
    const s = simulacaoVazia()
    alterarPessoa(s, 0, { idade: 99 })
    expect(s.familia.pessoas[0].idade).toBe(30)
  })
})
