/**
 * Regras que toda resposta da IA precisa cumprir antes de ser gravada no JSON.
 * Nada aqui chama a API: são funções puras, cobertas por testes.
 */
import { z } from 'zod'
import {
  GastosEsquema, ProgramaEsquema, ReferenciasEsquema,
  type Fonte, type Gastos, type Programa, type Referencias,
} from '../../src/dados/esquema'

/** Domínios oficiais aceitos (subdomínios incluídos). */
export const DOMINIOS_OFICIAIS = ['gov.br', 'leg.br', 'jus.br']

export function urlOficial(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return DOMINIOS_OFICIAIS.some((d) => host === d || host.endsWith(`.${d}`))
  } catch {
    return false
  }
}

export const MudancaEsquema = z.object({
  campo: z.string().describe('Caminho do campo alterado, ex.: "calculo.valor" ou "status".'),
  antes: z.string(),
  depois: z.string(),
  fonteUrl: z.string().url().describe('Página oficial que comprova a mudança.'),
}).strict()
export type Mudanca = z.infer<typeof MudancaEsquema>

export const RevisaoProgramaEsquema = z.object({
  situacao: z.enum(['sem_mudanca', 'atualizado', 'possivelmente_encerrado', 'sem_confirmacao'])
    .describe('sem_mudanca: tudo confere; atualizado: algo mudou; possivelmente_encerrado: indícios oficiais de fim; sem_confirmacao: não achou prova oficial recente.'),
  resumo: z.string().describe('Uma ou duas frases sobre o que foi verificado.'),
  mudancas: z.array(MudancaEsquema),
  programa: ProgramaEsquema.describe('O programa completo, já com as correções (igual ao original se nada mudou).'),
}).strict()
export type RevisaoPrograma = z.infer<typeof RevisaoProgramaEsquema>

export const NovosProgramasEsquema = z.object({
  programas: z.array(ProgramaEsquema).describe('Somente programas que ainda não estão no catálogo.'),
  observacoes: z.string().describe('O que foi pesquisado e o que ficou de fora (e por quê).'),
}).strict()
export type NovosProgramas = z.infer<typeof NovosProgramasEsquema>

export const RevisaoReferenciasEsquema = z.object({
  referencias: ReferenciasEsquema,
  mudancas: z.array(MudancaEsquema),
}).strict()

export const RevisaoGastosEsquema = z.object({
  gastos: GastosEsquema,
  mudancas: z.array(MudancaEsquema),
}).strict()

const chaveFonte = (f: Fonte) => f.url

/** Fontes novas (que não estavam antes) precisam ser de domínio oficial. */
export function fontesNaoOficiais(antes: Fonte[], depois: Fonte[]): string[] {
  const conhecidas = new Set(antes.map(chaveFonte))
  return depois.filter((f) => !conhecidas.has(chaveFonte(f)) && !urlOficial(f.url)).map((f) => f.url)
}

export type Resultado<T> = { ok: true; valor: T; avisos: string[] } | { ok: false; erro: string }

/**
 * Aplica a revisão de um programa: mantém id, esfera e UF, exige fonte oficial para
 * cada mudança e marca como "confirmar" o que não tiver comprovação.
 */
export function aplicarRevisao(original: Programa, revisao: RevisaoPrograma, hoje: string): Resultado<Programa> {
  const p = revisao.programa
  if (p.id !== original.id) return { ok: false, erro: `id mudou de ${original.id} para ${p.id}` }
  if (p.esfera !== original.esfera || p.uf !== original.uf) return { ok: false, erro: 'esfera ou UF mudou' }

  const semFonte = revisao.mudancas.filter((m) => !urlOficial(m.fonteUrl))
  if (semFonte.length) return { ok: false, erro: `mudança sem fonte oficial: ${semFonte.map((m) => m.campo).join(', ')}` }

  const naoOficiais = fontesNaoOficiais(original.fontes, p.fontes)
  if (naoOficiais.length) return { ok: false, erro: `fonte nova fora dos domínios oficiais: ${naoOficiais.join(', ')}` }

  const avisos: string[] = []
  let final: Programa = { ...p, conferido: hoje }

  if (revisao.situacao === 'sem_mudanca') {
    // Nada muda além da data de conferência, mesmo que a resposta traga diferenças sem registro.
    final = { ...original, conferido: hoje }
  } else if (revisao.situacao === 'possivelmente_encerrado' || revisao.situacao === 'sem_confirmacao') {
    final = {
      ...final,
      status: 'confirmar',
      observacao: revisao.situacao === 'possivelmente_encerrado'
        ? `Há indícios oficiais de que o programa foi encerrado. ${revisao.resumo}`
        : `Não encontramos prova oficial de pagamento recente. ${revisao.resumo}`,
    }
    if (original.status === 'ativo') avisos.push('passou de "ativo" para "confirmar" e saiu da soma da simulação')
  } else if (revisao.mudancas.length === 0) {
    return { ok: false, erro: 'situação "atualizado" sem nenhuma mudança listada' }
  }

  const checado = ProgramaEsquema.safeParse(final)
  if (!checado.success) return { ok: false, erro: `programa inválido: ${checado.error.issues.map((i) => i.message).join('; ')}` }
  return { ok: true, valor: checado.data, avisos }
}

/** Valida programas novos: id inédito, UF certa, fonte oficial e status coerente. */
export function aceitarNovos(
  existentes: Programa[], novos: Programa[], esperado: { esfera: 'federal' } | { esfera: 'estadual'; uf: string }, hoje: string,
): { aceitos: Programa[]; recusados: { id: string; motivo: string }[] } {
  const ids = new Set(existentes.map((p) => p.id))
  const nomes = new Set(existentes.map((p) => normalizar(p.nome)))
  const aceitos: Programa[] = []
  const recusados: { id: string; motivo: string }[] = []
  for (const p of novos) {
    const recusar = (motivo: string) => recusados.push({ id: p.id, motivo })
    if (ids.has(p.id) || nomes.has(normalizar(p.nome))) { recusar('já existe no catálogo'); continue }
    if (p.esfera !== esperado.esfera || (esperado.esfera === 'estadual' && p.uf !== esperado.uf)) { recusar('esfera ou UF diferente da pesquisada'); continue }
    if (!p.fontes.some((f) => urlOficial(f.url))) { recusar('nenhuma fonte de domínio oficial'); continue }
    const naoOficiais = p.fontes.filter((f) => !urlOficial(f.url))
    if (naoOficiais.length) { recusar(`fontes fora dos domínios oficiais: ${naoOficiais.map((f) => f.url).join(', ')}`); continue }
    const checado = ProgramaEsquema.safeParse({ ...p, conferido: hoje })
    if (!checado.success) { recusar(checado.error.issues.map((i) => i.message).join('; ')); continue }
    ids.add(p.id)
    nomes.add(normalizar(p.nome))
    aceitos.push(checado.data)
  }
  return { aceitos, recusados }
}

/** Referências e gastos: toda mudança precisa de fonte oficial; o resto passa pelo esquema. */
export function aplicarComFontes<T>(
  esquema: z.ZodType<T>, dados: T, mudancas: Mudanca[], fontesAntes: Fonte[], fontesDepois: Fonte[],
): Resultado<T> {
  const semFonte = mudancas.filter((m) => !urlOficial(m.fonteUrl))
  if (semFonte.length) return { ok: false, erro: `mudança sem fonte oficial: ${semFonte.map((m) => m.campo).join(', ')}` }
  const naoOficiais = fontesNaoOficiais(fontesAntes, fontesDepois)
  if (naoOficiais.length) return { ok: false, erro: `fonte nova fora dos domínios oficiais: ${naoOficiais.join(', ')}` }
  const checado = esquema.safeParse(dados)
  if (!checado.success) return { ok: false, erro: checado.error.issues.map((i) => i.message).join('; ') }
  return { ok: true, valor: checado.data, avisos: [] }
}

export function fontesDeGastos(g: Gastos): Fonte[] {
  return [...g.bolsaFamiliaMensal.map((m) => m.fonte), ...g.destaques.map((d) => d.fonte), ...g.numeros.map((n) => n.fonte)]
}

export const fontesDeReferencias = (r: Referencias): Fonte[] => r.fontes

function normalizar(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

