import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import programas from '../../src/dados/programas.json'
import type { Programa } from '../../src/dados/esquema'
import {
  aceitarNovos, aplicarRevisao, NovosProgramasEsquema, RevisaoGastosEsquema, RevisaoProgramaEsquema,
  RevisaoReferenciasEsquema, urlOficial, type RevisaoPrograma,
} from './validacao'

const catalogo = programas.programas as Programa[]
const original = catalogo.find((p) => p.id === 'ms-mais-social')!
const HOJE = '2026-11-01'
const FONTE = 'https://www.sead.ms.gov.br/mais-social'

const revisao = (parcial: Partial<RevisaoPrograma>): RevisaoPrograma => ({
  situacao: 'sem_mudanca', resumo: 'ok', mudancas: [], programa: original, ...parcial,
})

describe('domínios oficiais', () => {
  it('aceita gov.br e subdomínios, recusa o resto', () => {
    expect(urlOficial('https://www.gov.br/mds/x')).toBe(true)
    expect(urlOficial('https://www.planalto.gov.br/lei')).toBe(true)
    expect(urlOficial('https://www.camara.leg.br/x')).toBe(true)
    expect(urlOficial('https://govbr.com/x')).toBe(false)
    expect(urlOficial('https://noticias.com.br/gov.br')).toBe(false)
    expect(urlOficial('não é url')).toBe(false)
  })
})

describe('aplicarRevisao', () => {
  it('sem mudança: só atualiza a data de conferência', () => {
    const r = aplicarRevisao(original, revisao({ programa: { ...original, valorTexto: 'alterado sem registro' } }), HOJE)
    expect(r.ok && r.valor).toEqual({ ...original, conferido: HOJE })
  })

  it('aceita mudança com fonte oficial', () => {
    const novo = { ...original, calculo: { ...original.calculo!, valor: 500 }, valorTexto: 'R$ 500 por mês' }
    const r = aplicarRevisao(original, revisao({
      situacao: 'atualizado', programa: novo,
      mudancas: [{ campo: 'calculo.valor', antes: '450', depois: '500', fonteUrl: FONTE }],
    }), HOJE)
    expect(r.ok && r.valor.calculo?.valor).toBe(500)
  })

  it('recusa mudança sem fonte oficial', () => {
    const r = aplicarRevisao(original, revisao({
      situacao: 'atualizado', programa: original,
      mudancas: [{ campo: 'calculo.valor', antes: '450', depois: '500', fonteUrl: 'https://blog.com/x' }],
    }), HOJE)
    expect(r.ok).toBe(false)
  })

  it('recusa troca de id e fonte nova fora dos domínios oficiais', () => {
    expect(aplicarRevisao(original, revisao({ programa: { ...original, id: 'outro' } }), HOJE).ok).toBe(false)
    const comFonteRuim = { ...original, fontes: [...original.fontes, { titulo: 'Blog', url: 'https://blog.com/x', orgao: 'Blog' }] }
    expect(aplicarRevisao(original, revisao({
      situacao: 'atualizado', programa: comFonteRuim, mudancas: [{ campo: 'fontes', antes: '', depois: '', fonteUrl: FONTE }],
    }), HOJE).ok).toBe(false)
  })

  it('sem confirmação: vira "confirmar" e sai da soma', () => {
    const r = aplicarRevisao(original, revisao({ situacao: 'sem_confirmacao', resumo: 'Nada em 2026.' }), HOJE)
    expect(r.ok && r.valor.status).toBe('confirmar')
    expect(r.ok && r.avisos.length).toBe(1)
  })
})

describe('aceitarNovos', () => {
  const novo: Programa = {
    ...original, id: 'ms-novo-programa', nome: 'Programa Novo MS',
    fontes: [{ titulo: 'Lei', url: 'https://www.ms.gov.br/lei', orgao: 'Governo de MS' }],
  }

  it('aceita programa inédito com fonte oficial', () => {
    const { aceitos } = aceitarNovos(catalogo, [novo], { esfera: 'estadual', uf: 'MS' }, HOJE)
    expect(aceitos.map((p) => p.id)).toEqual(['ms-novo-programa'])
    expect(aceitos[0].conferido).toBe(HOJE)
  })

  it('recusa repetido, UF errada e fonte não oficial', () => {
    const { aceitos, recusados } = aceitarNovos(catalogo, [
      { ...novo, id: 'ms-mais-social' },
      { ...novo, id: 'ms-outro', nome: 'Outro', uf: 'GO' },
      { ...novo, id: 'ms-blog', nome: 'Blog', fontes: [{ titulo: 'x', url: 'https://blog.com', orgao: 'x' }] },
    ], { esfera: 'estadual', uf: 'MS' }, HOJE)
    expect(aceitos).toEqual([])
    expect(recusados).toHaveLength(3)
  })
})

describe('ferramentas da API', () => {
  it('os esquemas viram JSON Schema de objeto', () => {
    for (const esquema of [RevisaoProgramaEsquema, NovosProgramasEsquema, RevisaoReferenciasEsquema, RevisaoGastosEsquema]) {
      const js = z.toJSONSchema(esquema, { io: 'input' }) as { type: string; properties: object }
      expect(js.type).toBe('object')
      expect(Object.keys(js.properties).length).toBeGreaterThan(0)
    }
  })
})
