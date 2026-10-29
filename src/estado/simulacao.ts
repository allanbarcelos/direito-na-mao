import type { Familia, Pessoa } from '../calculo/tipos'
import { apagar, gravar, ler } from '../lib/armazenamento'

const CHAVE = 'simulacao-v1'

export type Modo = 'eu' | 'familia' | ''

export interface Simulacao {
  modo: Modo
  familia: Familia
}

let seq = 0
export function novaPessoa(idade = 30): Pessoa {
  seq += 1
  return {
    id: `${Date.now().toString(36)}-${seq}`, nome: '', idade, sexo: '', deficiencia: false, zika: false,
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

// ---------- transformações puras (sem React) ----------

export function definirQuantidade(s: Simulacao, quantidade: number): Simulacao {
  const atuais = s.familia.pessoas
  const pessoas = quantidade > atuais.length
    ? [...atuais, ...Array.from({ length: quantidade - atuais.length }, () => novaPessoa(10))]
    : atuais.slice(0, quantidade)
  return { ...s, familia: { ...s.familia, pessoas } }
}

export function definirModo(s: Simulacao, modo: Modo): Simulacao {
  const comModo = { ...s, modo }
  if (modo === 'eu') return definirQuantidade(comModo, 1)
  if (modo === 'familia' && s.familia.pessoas.length < 2) return definirQuantidade(comModo, 2)
  return comModo
}

export function alterarFamilia(s: Simulacao, parcial: Partial<Familia>): Simulacao {
  return { ...s, familia: { ...s.familia, ...parcial } }
}

export function alterarPessoa(s: Simulacao, indice: number, parcial: Partial<Pessoa>): Simulacao {
  const pessoas = s.familia.pessoas.map((p, i) => (i === indice ? { ...p, ...parcial } : p))
  return { ...s, familia: { ...s.familia, pessoas } }
}

// ---------- persistência no aparelho ----------

/**
 * Simulações salvas antes da pergunta sobre sexo não têm esse campo. Quem estava marcada
 * como grávida, amamentando ou "mulher responsável" é do sexo feminino; o resto fica em branco.
 */
function migrar(s: Simulacao): Simulacao {
  const pessoas = s.familia.pessoas.map((p) => (p.sexo !== undefined ? p : {
    ...p, sexo: (p.gestante || p.amamentando || p.responsavel ? 'feminino' : '') as Pessoa['sexo'],
  }))
  return { ...s, familia: { ...s.familia, pessoas } }
}

export const carregarSimulacao = () => migrar(ler<Simulacao>(CHAVE, simulacaoVazia()))
export const salvarSimulacao = (s: Simulacao) => gravar(CHAVE, s)
export const limparSimulacao = () => apagar(CHAVE)
