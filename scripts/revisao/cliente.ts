/**
 * Chamada à API com pesquisa na web restrita a domínios oficiais.
 * O modelo responde chamando uma ferramenta nossa; a entrada é validada com zod e,
 * se vier inválida, o erro volta para o modelo corrigir.
 */
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { DOMINIOS_OFICIAIS } from './validacao'

export const MODELO = process.env.MODELO_REVISAO ?? 'claude-opus-5-5'
const MAX_RODADAS = 8

export interface Uso {
  chamadas: number
  entrada: number
  saida: number
  cacheLido: number
  buscas: number
}

export const uso: Uso = { chamadas: 0, entrada: 0, saida: 0, cacheLido: 0, buscas: 0 }

let cliente: Anthropic | undefined
const obterCliente = () => (cliente ??= new Anthropic())

export class FalhaConsulta extends Error {}

/**
 * Pede ao modelo que pesquise e responda chamando `ferramenta`.
 * `sistema` deve ser estável entre chamadas (fica em cache).
 */
export async function consultar<T>(opcoes: {
  sistema: string
  pedido: string
  ferramenta: { nome: string; descricao: string; esquema: z.ZodType<T> }
  maxBuscas?: number
}): Promise<T> {
  const { sistema, pedido, ferramenta } = opcoes
  const maxBuscas = opcoes.maxBuscas ?? 8

  const tools: Anthropic.Beta.BetaToolUnion[] = [
    { type: 'web_search_20260209', name: 'web_search', max_uses: maxBuscas, allowed_domains: DOMINIOS_OFICIAIS },
    { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: maxBuscas, allowed_domains: DOMINIOS_OFICIAIS },
    {
      name: ferramenta.nome,
      description: ferramenta.descricao,
      input_schema: z.toJSONSchema(ferramenta.esquema, { io: 'input' }) as Anthropic.Beta.BetaTool.InputSchema,
    },
  ]
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: pedido }]

  for (let rodada = 0; rodada < MAX_RODADAS; rodada++) {
    const resposta = await obterCliente().beta.messages.stream({
      model: MODELO,
      max_tokens: 64000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      // Se o modelo principal recusar, a API tenta outro modelo na mesma chamada.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: sistema, cache_control: { type: 'ephemeral' } }],
      tools,
      messages,
    }).finalMessage()

    uso.chamadas++
    uso.entrada += resposta.usage.input_tokens
    uso.saida += resposta.usage.output_tokens
    uso.cacheLido += resposta.usage.cache_read_input_tokens ?? 0
    uso.buscas += resposta.usage.server_tool_use?.web_search_requests ?? 0

    if (resposta.stop_reason === 'refusal') {
      throw new FalhaConsulta(`o modelo recusou (${resposta.stop_details?.category ?? 'sem categoria'})`)
    }

    // A resposta inteira volta para o histórico, sem edição (inclui pensamento e resultados de busca).
    messages.push({ role: 'assistant', content: resposta.content })

    if (resposta.stop_reason === 'pause_turn') continue
    if (resposta.stop_reason === 'max_tokens') throw new FalhaConsulta('resposta cortada por max_tokens')

    const chamada = resposta.content.find(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use' && b.name === ferramenta.nome,
    )
    if (!chamada) {
      messages.push({ role: 'user', content: `Termine chamando a ferramenta ${ferramenta.nome} com o resultado.` })
      continue
    }

    const validado = ferramenta.esquema.safeParse(chamada.input)
    if (validado.success) return validado.data

    const problemas = validado.error.issues.map((i) => `${i.path.join('.') || '(raiz)'}: ${i.message}`).join('\n')
    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: chamada.id, is_error: true, content: `Entrada inválida. Corrija e chame de novo:\n${problemas}` }],
    })
  }
  throw new FalhaConsulta(`sem resposta válida após ${MAX_RODADAS} rodadas`)
}
