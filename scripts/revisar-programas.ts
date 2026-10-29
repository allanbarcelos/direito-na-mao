/**
 * Revisão automática do catálogo com IA.
 *
 *   npm run revisar -- [--modo tudo|revisar|novos|referencias|gastos]
 *                      [--programas id1,id2] [--ufs CE,MA] [--concorrencia 3] [--seco]
 *
 * Lê e grava somente src/dados/*.json. Escreve um relatório em .revisao/relatorio.md,
 * usado como corpo do Pull Request. Nada é publicado sem revisão humana.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import type { Gastos, Programa, Referencias } from '../src/dados/esquema'
import { GastosEsquema, ReferenciasEsquema } from '../src/dados/esquema'
import { UFS, type UF } from '../src/servicos/tipos'
import { consultar, MODELO, uso } from './revisao/cliente'
import { pedidoGastos, pedidoNovos, pedidoReferencias, pedidoRevisao, SISTEMA } from './revisao/prompts'
import {
  aceitarNovos, aplicarComFontes, aplicarRevisao, fontesDeGastos, NovosProgramasEsquema,
  RevisaoGastosEsquema, RevisaoProgramaEsquema, RevisaoReferenciasEsquema, type Mudanca,
} from './revisao/validacao'

const MODOS = ['tudo', 'revisar', 'novos', 'referencias', 'gastos'] as const
const { values: args } = parseArgs({
  options: {
    modo: { type: 'string', default: 'tudo' },
    programas: { type: 'string', default: '' },
    ufs: { type: 'string', default: '' },
    concorrencia: { type: 'string', default: '3' },
    seco: { type: 'boolean', default: false },
  },
})
const modo = args.modo as (typeof MODOS)[number]
if (!MODOS.includes(modo)) throw new Error(`--modo deve ser um de: ${MODOS.join(', ')}`)
const lista = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)
const filtroIds = lista(args.programas)
const filtroUfs = lista(args.ufs).map((u) => u.toUpperCase()) as UF[]
const concorrencia = Math.max(1, Number(args.concorrencia) || 3)
const faz = (m: (typeof MODOS)[number]) => modo === 'tudo' || modo === m

const hoje = new Date().toISOString().slice(0, 10)
const arquivo = (nome: string) => new URL(`../src/dados/${nome}.json`, import.meta.url)
const ler = <T>(nome: string): T => JSON.parse(readFileSync(arquivo(nome), 'utf8')) as T
const gravar = (nome: string, dados: unknown) => {
  if (!args.seco) writeFileSync(arquivo(nome), `${JSON.stringify(dados, null, 2)}\n`)
}

// ---------- relatório ----------
const rel = {
  atualizados: [] as { id: string; nome: string; mudancas: Mudanca[]; avisos: string[] }[],
  paraConfirmar: [] as { id: string; nome: string; motivo: string }[],
  novos: [] as Programa[],
  recusados: [] as { id: string; motivo: string }[],
  referencias: [] as Mudanca[],
  gastos: [] as Mudanca[],
  observacoes: [] as string[],
  erros: [] as string[],
  conferidos: 0,
}

async function emParalelo<T>(itens: T[], fn: (item: T) => Promise<void>): Promise<void> {
  const fila = [...itens]
  await Promise.all(Array.from({ length: Math.min(concorrencia, fila.length) }, async () => {
    for (let item = fila.shift(); item !== undefined; item = fila.shift()) await fn(item)
  }))
}

const mensagem = (e: unknown) => (e instanceof Error ? e.message : String(e))
const log = (s: string) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${s}`)

// ---------- tarefas ----------
async function revisarReferencias() {
  const atual = ler<Referencias>('referencias')
  log('referências: revisando')
  const r = await consultar({
    sistema: SISTEMA, pedido: pedidoReferencias(atual, hoje),
    ferramenta: { nome: 'registrar_referencias', descricao: 'Registra os valores de referência revisados.', esquema: RevisaoReferenciasEsquema },
  })
  const aplicado = aplicarComFontes(ReferenciasEsquema, { ...r.referencias, dataAtualizacao: hoje }, r.mudancas, atual.fontes, r.referencias.fontes)
  if (!aplicado.ok) throw new Error(`referências: ${aplicado.erro}`)
  rel.referencias = r.mudancas
  gravar('referencias', aplicado.valor)
}

async function revisarGastos() {
  const atual = ler<Gastos>('gastos')
  log('gastos: revisando')
  const r = await consultar({
    sistema: SISTEMA, pedido: pedidoGastos(atual, hoje),
    ferramenta: { nome: 'registrar_gastos', descricao: 'Registra os números de gasto atualizados.', esquema: RevisaoGastosEsquema },
  })
  const aplicado = aplicarComFontes(GastosEsquema, r.gastos, r.mudancas, fontesDeGastos(atual), fontesDeGastos(r.gastos))
  if (!aplicado.ok) throw new Error(`gastos: ${aplicado.erro}`)
  rel.gastos = r.mudancas
  gravar('gastos', aplicado.valor)
}

async function revisarProgramas(banco: { programas: Programa[] }) {
  const alvos = banco.programas.filter((p) =>
    (!filtroIds.length || filtroIds.includes(p.id)) && (!filtroUfs.length || (p.uf && filtroUfs.includes(p.uf))))
  await emParalelo(alvos, async (original) => {
    log(`revisando ${original.id}`)
    try {
      const r = await consultar({
        sistema: SISTEMA, pedido: pedidoRevisao(original, hoje),
        ferramenta: { nome: 'registrar_revisao', descricao: 'Registra o resultado da revisão de um programa.', esquema: RevisaoProgramaEsquema },
      })
      const aplicado = aplicarRevisao(original, r, hoje)
      if (!aplicado.ok) { rel.erros.push(`${original.id}: ${aplicado.erro}`); return }
      const i = banco.programas.findIndex((p) => p.id === original.id)
      banco.programas[i] = aplicado.valor
      rel.conferidos++
      if (r.situacao === 'atualizado') rel.atualizados.push({ id: original.id, nome: original.nome, mudancas: r.mudancas, avisos: aplicado.avisos })
      if (r.situacao === 'possivelmente_encerrado' || r.situacao === 'sem_confirmacao') {
        rel.paraConfirmar.push({ id: original.id, nome: original.nome, motivo: r.resumo })
      }
    } catch (e) {
      rel.erros.push(`${original.id}: ${mensagem(e)}`)
    }
  })
}

async function buscarNovos(banco: { programas: Programa[] }) {
  const alvos: ('federal' | UF)[] = filtroUfs.length ? filtroUfs : ['federal', ...UFS]
  await emParalelo(alvos, async (alvo) => {
    log(`procurando programas novos: ${alvo}`)
    const existentes = banco.programas.filter((p) => (alvo === 'federal' ? p.esfera === 'federal' : p.uf === alvo))
    try {
      const r = await consultar({
        sistema: SISTEMA, pedido: pedidoNovos(alvo, existentes, hoje), maxBuscas: 12,
        ferramenta: { nome: 'registrar_novos', descricao: 'Registra programas novos encontrados.', esquema: NovosProgramasEsquema },
      })
      const esperado = alvo === 'federal' ? { esfera: 'federal' as const } : { esfera: 'estadual' as const, uf: alvo }
      const { aceitos, recusados } = aceitarNovos(banco.programas, r.programas, esperado, hoje)
      banco.programas.push(...aceitos)
      rel.novos.push(...aceitos)
      rel.recusados.push(...recusados)
      if (r.observacoes.trim()) rel.observacoes.push(`**${alvo}:** ${r.observacoes.trim()}`)
    } catch (e) {
      rel.erros.push(`novos (${alvo}): ${mensagem(e)}`)
    }
  })
}

// ---------- execução ----------
async function principal() {
  log(`modo ${modo}, modelo ${MODELO}${args.seco ? ' (seco: nada será gravado)' : ''}`)
  if (faz('referencias')) await revisarReferencias().catch((e) => rel.erros.push(mensagem(e)))
  if (faz('gastos')) await revisarGastos().catch((e) => rel.erros.push(mensagem(e)))

  const banco = ler<{ programas: Programa[] }>('programas')
  if (faz('revisar')) await revisarProgramas(banco)
  if (faz('novos')) await buscarNovos(banco)
  if (faz('revisar') || faz('novos')) gravar('programas', banco)

  escreverRelatorio()
  log(`fim: ${rel.atualizados.length} atualizados, ${rel.novos.length} novos, ${rel.erros.length} erros`)

  // Falha total (ex.: chave da API inválida) precisa aparecer como erro no GitHub Actions.
  const algumSucesso = rel.conferidos > 0 || rel.novos.length > 0 || rel.referencias.length > 0 || rel.gastos.length > 0
  if (rel.erros.length > 0 && !algumSucesso) process.exitCode = 1
}

function escreverRelatorio() {
  const linhas: string[] = [`## Revisão automática dos programas (${hoje})`, '']
  linhas.push(
    'Revisão feita com IA pesquisando apenas em domínios oficiais (gov.br, leg.br, jus.br). ' +
    '**Confira cada mudança na fonte antes de aprovar.** Programas novos e mudanças de valor afetam diretamente a simulação.', '')
  linhas.push(`Modo: \`${modo}\` · programas conferidos: ${rel.conferidos} · atualizados: ${rel.atualizados.length} · novos: ${rel.novos.length} · erros: ${rel.erros.length}`, '')

  const tabelaMudancas = (ms: Mudanca[]) => [
    '| Campo | Antes | Depois | Fonte |', '|---|---|---|---|',
    ...ms.map((m) => `| \`${m.campo}\` | ${celula(m.antes)} | ${celula(m.depois)} | ${m.fonteUrl} |`),
  ]
  if (rel.referencias.length) linhas.push('### Valores de referência', '', ...tabelaMudancas(rel.referencias), '')
  if (rel.gastos.length) linhas.push('### Gastos', '', ...tabelaMudancas(rel.gastos), '')
  if (rel.atualizados.length) {
    linhas.push('### Programas atualizados', '')
    for (const a of rel.atualizados) {
      linhas.push(`#### ${a.nome} (\`${a.id}\`)`, '', ...tabelaMudancas(a.mudancas), '')
      for (const av of a.avisos) linhas.push(`> Atenção: ${av}`, '')
    }
  }
  if (rel.paraConfirmar.length) {
    linhas.push('### Marcados como "confirmar" (saem da soma da simulação)', '')
    for (const p of rel.paraConfirmar) linhas.push(`- **${p.nome}** (\`${p.id}\`): ${p.motivo}`)
    linhas.push('')
  }
  if (rel.novos.length) {
    linhas.push('### Programas novos', '')
    for (const p of rel.novos) {
      linhas.push(`- **${p.nome}** (\`${p.id}\`, ${p.uf ?? 'federal'}, status \`${p.status}\`${p.calculo ? '' : ', sem cálculo'}): ${p.valorTexto}. Fontes: ${p.fontes.map((f) => f.url).join(', ')}`)
    }
    linhas.push('')
  }
  if (rel.recusados.length) {
    linhas.push('<details><summary>Sugestões recusadas pela validação</summary>', '')
    for (const r of rel.recusados) linhas.push(`- \`${r.id}\`: ${r.motivo}`)
    linhas.push('', '</details>', '')
  }
  if (rel.observacoes.length) {
    linhas.push('<details><summary>Notas da busca por programas novos</summary>', '', ...rel.observacoes.map((o) => `- ${o}`), '', '</details>', '')
  }
  if (rel.erros.length) linhas.push('### Erros', '', ...rel.erros.map((e) => `- ${e}`), '')
  linhas.push(`<sub>Modelo: ${MODELO} · chamadas: ${uso.chamadas} · tokens de entrada: ${uso.entrada} (cache: ${uso.cacheLido}) · saída: ${uso.saida} · buscas: ${uso.buscas}</sub>`, '')

  mkdirSync(new URL('../.revisao/', import.meta.url), { recursive: true })
  writeFileSync(new URL('../.revisao/relatorio.md', import.meta.url), linhas.join('\n'))
}

const celula = (s: string) => s.replaceAll('|', '\\|').replaceAll('\n', ' ').slice(0, 200)

principal().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
