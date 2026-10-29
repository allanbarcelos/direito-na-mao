import { useEffect, useState } from 'react'
import type { Familia, Pessoa } from '../calculo/tipos'
import {
  alterarFamilia, alterarPessoa, carregarSimulacao, definirModo, definirQuantidade,
  limparSimulacao, salvarSimulacao, simulacaoVazia, type Modo, type Simulacao,
} from './simulacao'

/** Estado da simulação, salvo no aparelho a cada mudança. */
export function useSimulacao() {
  const [simulacao, setSimulacao] = useState<Simulacao>(carregarSimulacao)

  useEffect(() => {
    salvarSimulacao(simulacao)
  }, [simulacao])

  return {
    simulacao,
    escolherModo: (modo: Modo) => setSimulacao((s) => definirModo(s, modo)),
    mudarQuantidade: (q: number) => setSimulacao((s) => definirQuantidade(s, q)),
    mudarFamilia: (parcial: Partial<Familia>) => setSimulacao((s) => alterarFamilia(s, parcial)),
    mudarPessoa: (i: number, parcial: Partial<Pessoa>) => setSimulacao((s) => alterarPessoa(s, i, parcial)),
    recomecar: () => {
      limparSimulacao()
      setSimulacao(simulacaoVazia())
    },
  }
}
