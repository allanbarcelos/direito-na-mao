import type { Familia, Pessoa } from '../calculo/tipos'
import { apagar, gravar, ler } from '../lib/armazenamento'

const CHAVE = 'simulacao-v1'

export interface Simulacao {
  modo: 'eu' | 'familia' | ''
  familia: Familia
}

let seq = 0
export function novaPessoa(idade = 30): Pessoa {
  seq += 1
  return {
    id: `${Date.now().toString(36)}-${seq}`, nome: '', idade, deficiencia: false, zika: false,
    gestante: false, amamentando: false, escola: 'nao', integral: false, rendaTrabalho: 0,
    trabalhoFormal: false, aposentadoria: 0, recebeBPC: false, saiuDoBPC: false, pescador: false,
    agricultor: false, indigenaQuilombola: false, responsavel: false,
  }
}

export function simulacaoVazia(): Simulacao {
  return {
    modo: '',
    familia: {
      uf: '', pessoas: [novaPessoa()], semiarido: false, reservaOuAssentamento: false,
      recebeBolsaFamilia: false, cadUnico: 'sim',
    },
  }
}

export const carregarSimulacao = () => ler<Simulacao>(CHAVE, simulacaoVazia())
export const salvarSimulacao = (s: Simulacao) => gravar(CHAVE, s)
export const limparSimulacao = () => apagar(CHAVE)
