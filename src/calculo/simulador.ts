import { BPC } from '../servicos/referencias'
import { gerarDicas } from './dicas'
import { aplicarRegras, criarBeneficio } from './regras/aplicar'
import { avaliarBolsaFamilia } from './regras/bolsaFamilia'
import { podePedirBPC, passaRendaBPC, REGRA_BPC } from './regras/bpc'
import { nomeDe, rendaBase } from './regras/comum'
import { regrasDoEstado } from './regras/estaduais'
import { REGRAS_FEDERAIS } from './regras/federais'
import type { Cenario, Contexto, Familia, Resultado } from './tipos'

export { podePedirBPC, passaRendaBPC } from './regras/bpc'
export { valorBolsaFamilia } from './regras/bolsaFamilia'
export { rendaBase } from './regras/comum'

const MAX_CANDIDATOS_BPC = 6
const arred = (v: number) => Math.round(v * 100) / 100

function contexto(f: Familia, bpcPara: string[]): Omit<Contexto, 'bolsaFamilia' | 'recebeBolsaFamilia'> {
  const n = f.pessoas.length
  const quantosBPC = f.pessoas.filter((p) => p.recebeBPC).length + bpcPara.length
  const rendaFamiliar = rendaBase(f) + quantosBPC * BPC.valor
  return { familia: f, n, rendaFamiliar, rendaPorPessoa: rendaFamiliar / n, bpcPara: new Set(bpcPara) }
}

/** Monta um cenário: quem pede BPC e se a família tenta o Bolsa Família. */
function montarCenario(f: Familia, bpcPara: string[], tentarBolsaFamilia: boolean): Cenario {
  const base = contexto(f, bpcPara)
  const bf = tentarBolsaFamilia ? avaliarBolsaFamilia(f, base.rendaPorPessoa) : { valor: 0 }
  const ctx: Contexto = { ...base, bolsaFamilia: bf.valor, recebeBolsaFamilia: bf.avaliacao !== undefined }

  const beneficios = [
    ...aplicarRegras([REGRA_BPC], ctx),
    ...(bf.avaliacao ? [criarBeneficio('bolsa-familia', bf.avaliacao)] : []),
    ...aplicarRegras([...REGRAS_FEDERAIS, ...regrasDoEstado(f.uf)], ctx),
  ].filter((b) => b.status === 'ativo').map((b) => b.beneficio)

  const permanente = beneficios.filter((x) => !x.temporario).reduce((s, x) => s + x.valorMensal, 0)
  const total = beneficios.reduce((s, x) => s + x.valorMensal, 0)
  const nomes = bpcPara.map((id) => {
    const i = f.pessoas.findIndex((p) => p.id === id)
    return nomeDe(f.pessoas[i], i)
  })
  return {
    bpcPara,
    comBolsaFamilia: ctx.recebeBolsaFamilia,
    beneficios,
    totalPermanente: arred(permanente),
    totalComTemporarios: arred(total),
    totalAnual: arred(total * 12),
    descricao: [
      nomes.length ? `Pedir BPC para ${nomes.join(', ')}` : 'Sem pedir BPC novo',
      ctx.recebeBolsaFamilia ? 'com Bolsa Família' : 'sem Bolsa Família',
    ].join(', '),
  }
}

function subconjuntos<T>(lista: T[]): T[][] {
  return lista.reduce<T[][]>((acc, item) => acc.concat(acc.map((s) => [...s, item])), [[]])
}

/** Cenários com exatamente os mesmos benefícios contam uma vez só. */
function semRepetidos(cenarios: Cenario[]): Cenario[] {
  const vistos = new Set<string>()
  return cenarios.filter((c) => {
    const k = c.beneficios.map((x) => `${x.programaId}:${x.pessoa ?? ''}:${x.valorMensal}`).sort().join('|')
    if (vistos.has(k)) return false
    vistos.add(k)
    return true
  })
}

/**
 * Testa todas as combinações (pedir BPC para quem pode × com/sem Bolsa Família)
 * e devolve a que dá mais dinheiro todo mês de forma permanente.
 */
export function simular(f: Familia): Resultado {
  if (f.pessoas.length === 0) throw new Error('Família sem pessoas')
  const candidatos = f.pessoas.filter((p) => podePedirBPC(p) && passaRendaBPC(f, p)).slice(0, MAX_CANDIDATOS_BPC)

  const cenarios = subconjuntos(candidatos.map((p) => p.id))
    .flatMap((sub) => [montarCenario(f, sub, true), montarCenario(f, sub, false)])
    .sort((a, b) => b.totalPermanente - a.totalPermanente || b.totalComTemporarios - a.totalComTemporarios)
  const unicos = semRepetidos(cenarios)
  const melhor = unicos[0]

  // Programas "a confirmar" do estado, avaliados no melhor cenário (ficam fora da soma).
  const base = contexto(f, melhor.bpcPara)
  const bfMelhor = melhor.beneficios.find((b) => b.programaId === 'bolsa-familia')?.valorMensal ?? 0
  const aConfirmar = aplicarRegras(regrasDoEstado(f.uf), {
    ...base, bolsaFamilia: bfMelhor, recebeBolsaFamilia: melhor.comBolsaFamilia,
  }).filter((b) => b.status === 'confirmar').map((b) => b.beneficio)

  return {
    melhor,
    alternativas: unicos.slice(1, 4),
    aConfirmar,
    dicas: gerarDicas(f, melhor, unicos, candidatos),
    rendaPorPessoa: arred(base.rendaPorPessoa),
    pessoas: f.pessoas.length,
  }
}
