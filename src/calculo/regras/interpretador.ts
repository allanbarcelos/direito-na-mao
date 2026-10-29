import type { Calculo, Condicao, FiltroPessoa, Programa, Valor } from '../../dados/esquema'
import { brl } from '../../lib/formatar'
import { SALARIO_MINIMO } from '../../servicos/referencias'
import type { Avaliacao, Contexto, Pessoa, Regra } from '../tipos'
import { nomeDe } from './comum'

/** Converte { sm: 0.5 } em reais; números passam direto. */
export function resolver(v: Valor): number {
  return typeof v === 'number' ? v : v.sm * SALARIO_MINIMO
}

const recebeOuPedeBPC = (p: Pessoa, ctx: Contexto) => p.recebeBPC || ctx.bpcPara.has(p.id)

export function pessoaBate(p: Pessoa, f: FiltroPessoa, ctx: Contexto): boolean {
  if (f.idadeMin !== undefined && p.idade < f.idadeMin) return false
  if (f.idadeMax !== undefined && p.idade > f.idadeMax) return false
  if (f.escola && !f.escola.includes(p.escola)) return false
  if (f.sexo !== undefined && p.sexo !== f.sexo) return false
  if (f.rendaTrabalhoMax !== undefined && p.rendaTrabalho > resolver(f.rendaTrabalhoMax)) return false
  if (f.semBPC !== undefined && f.semBPC === recebeOuPedeBPC(p, ctx)) return false
  if (f.semAposentadoria !== undefined && f.semAposentadoria !== (p.aposentadoria === 0)) return false
  const booleanos = [
    'integral', 'deficiencia', 'zika', 'gestante', 'amamentando', 'responsavel', 'trabalhoFormal',
    'saiuDoBPC', 'pescador', 'agricultor', 'indigenaQuilombola',
  ] as const
  return booleanos.every((campo) => f[campo] === undefined || f[campo] === p[campo])
}

export function condicaoBate(c: Condicao, ctx: Contexto): boolean {
  const { familia: f, n } = ctx
  if (c.rendaPorPessoaMax !== undefined && ctx.rendaPorPessoa > resolver(c.rendaPorPessoaMax)) return false
  if (c.rendaComBolsaFamiliaMax !== undefined && (ctx.rendaFamiliar + ctx.bolsaFamilia) / n > resolver(c.rendaComBolsaFamiliaMax)) return false
  if (c.rendaFamiliarMax !== undefined && ctx.rendaFamiliar > resolver(c.rendaFamiliarMax)) return false
  if (c.bolsaFamilia === 'exige' && !ctx.recebeBolsaFamilia) return false
  if (c.bolsaFamilia === 'exclui' && ctx.recebeBolsaFamilia) return false
  if (c.pessoasMin !== undefined && n < c.pessoasMin) return false
  if (c.semiarido !== undefined && c.semiarido !== f.semiarido) return false
  if (c.reservaOuAssentamento !== undefined && c.reservaOuAssentamento !== f.reservaOuAssentamento) return false
  if (c.temBPC !== undefined && c.temBPC !== f.pessoas.some((p) => recebeOuPedeBPC(p, ctx))) return false
  if (c.alguem && !c.alguem.every((filtro) => f.pessoas.some((p) => pessoaBate(p, filtro, ctx)))) return false
  return true
}

/** Devolve o motivo que vale, ou null se os requisitos não forem atendidos. */
function requisitosAtendidos(calculo: Calculo, ctx: Contexto): string | null {
  const { qualquer, ...todos } = calculo.requisitos ?? {}
  if (!condicaoBate(todos, ctx)) return null
  if (!qualquer) return calculo.motivo
  const ramo = qualquer.find((c) => condicaoBate(c, ctx))
  return ramo ? (ramo.motivo ?? calculo.motivo) : null
}

const preencher = (texto: string, valor: number, n: number) =>
  texto.replaceAll('{valor}', brl(valor)).replaceAll('{n}', String(n))

/** Aplica o "calculo" de um programa do JSON a um cenário. */
export function avaliarCalculo(c: Calculo, ctx: Contexto): Avaliacao[] {
  const motivo = requisitosAtendidos(c, ctx)
  if (motivo === null) return []

  const porAno = c.pagamentosPorAno ?? 12
  const texto = c.textoPorTamanho?.find((t) => ctx.n >= t.pessoasMin)?.texto ?? c.texto ?? '{valor} por mês'
  const avaliacao = (pago: number, pessoa?: string): Avaliacao => ({
    valorMensal: c.semValor ? 0 : (pago * porAno) / 12,
    valorTexto: preencher(texto, pago, ctx.n),
    motivo: preencher(motivo, pago, ctx.n),
    pessoa,
    avisos: c.avisos,
    temporario: c.temporario,
    frequencia: c.frequencia,
    nome: c.nome,
  })

  if (c.tipo === 'porPessoa') {
    const filtro = c.pessoas ?? {}
    return ctx.familia.pessoas
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => pessoaBate(p, filtro, ctx))
      .slice(0, c.maxPessoas)
      .map(({ p, i }) => avaliacao(resolver(p.integral && c.valorIntegral !== undefined ? c.valorIntegral : c.valor), nomeDe(p, i)))
  }

  if (c.tipo === 'porPessoaDaFamilia') {
    return [avaliacao(Math.round(resolver(c.valor) * ctx.n * 100) / 100)]
  }

  const extra = (c.adicionais ?? []).reduce((soma, a) => {
    const quantos = ctx.familia.pessoas.filter((p) => pessoaBate(p, a.por, ctx)).length
    return soma + Math.max(0, quantos - (a.descontar ?? 0)) * resolver(a.valor)
  }, 0)
  return [avaliacao(resolver(c.valor) + extra)]
}

/** Regra de simulação de um programa do catálogo (null se ele não tem cálculo). */
export function regraDe(p: Programa): Regra | null {
  const calculo = p.calculo
  return calculo ? { programaId: p.id, avaliar: (ctx) => avaliarCalculo(calculo, ctx) } : null
}
