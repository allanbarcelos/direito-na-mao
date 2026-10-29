import { describe, expect, it } from 'vitest'
import { simular } from '../calculo/simulador'
import type { Pessoa } from '../calculo/tipos'
import type { Simulacao } from '../estado/simulacao'
import { AVISO_NAO_OFICIAL, montarDocumento, montarFontes, montarPerguntas, type Bloco } from './conteudo'
import { gerarPdf, limparTexto } from './gerar'

let seq = 0
const pessoa = (p: Partial<Pessoa> = {}): Pessoa => ({
  id: `d${++seq}`, nome: '', idade: 30, sexo: 'feminino', deficiencia: false, zika: false, gestante: false,
  amamentando: false, escola: 'nao', integral: false, rendaTrabalho: 0, trabalhoFormal: false,
  aposentadoria: 0, recebeBPC: false, saiuDoBPC: false, pescador: false, agricultor: false,
  indigenaQuilombola: false, responsavel: true, ...p,
})

const sim: Simulacao = {
  modo: 'familia',
  familia: {
    uf: 'MS', semiarido: false, reservaOuAssentamento: false, recebeBolsaFamilia: false, cadUnico: 'desatualizado',
    pessoas: [
      pessoa({ nome: 'Ana' }), pessoa({ nome: 'Vó Maria', idade: 70, responsavel: false }),
      pessoa({ idade: 4, responsavel: false }), pessoa({ idade: 16, escola: 'medio', sexo: 'masculino', responsavel: false }),
    ],
  },
}
const resultado = simular(sim.familia)
const QUANDO = new Date('2026-10-29T12:00:00Z')
const textos = (blocos: Bloco[]) => JSON.stringify(blocos)

describe('conteúdo do PDF', () => {
  const blocos = montarDocumento(sim, resultado, QUANDO)

  it('começa avisando que não é documento oficial', () => {
    expect(blocos[0].tipo).toBe('titulo')
    expect(blocos[1]).toMatchObject({ tipo: 'aviso', texto: AVISO_NAO_OFICIAL })
    expect(AVISO_NAO_OFICIAL).toMatch(/NÃO é oficial/)
  })

  it('traz cada benefício da simulação com valor e motivo', () => {
    const beneficios = blocos.filter((b) => b.tipo === 'beneficio')
    expect(beneficios).toHaveLength(resultado.melhor.beneficios.length)
    expect(textos(blocos)).toContain('Bolsa Família')
    expect(textos(blocos)).toContain('Por quê:')
  })

  it('lista as fontes oficiais de cada benefício e dos valores de referência', () => {
    const fontes = montarFontes(resultado)
    expect(fontes[0].programa).toMatch(/referência/)
    const urls = fontes.flatMap((g) => g.fontes.map((f) => f.url))
    expect(urls.some((u) => u.includes('l14601'))).toBe(true) // Lei do Bolsa Família
    expect(urls.some((u) => u.includes('l8742'))).toBe(true) // LOAS (BPC)
  })

  it('gera perguntas para o CRAS a partir do resultado', () => {
    const perguntas = montarPerguntas(sim, resultado)
    expect(perguntas[0]).toMatch(/Cadastro Único/)
    expect(perguntas.some((p) => p.includes('Posso pedir o BPC para Vó Maria'))).toBe(true)
    expect(perguntas.some((p) => p.includes('atende a minha cidade'))).toBe(true)
  })

  it('descreve os dados informados', () => {
    expect(textos(blocos)).toContain('Ana: 30 anos, feminino, responsável pela família.')
    expect(textos(blocos)).toContain('desatualizado')
  })
})

describe('arquivo PDF', () => {
  it('troca caracteres que a fonte do PDF não tem e mantém os acentos', () => {
    expect(limparTexto('São João → ação ≤ 2 🎉')).toBe('São João -> ação <= 2 ')
  })

  it('gera um PDF válido com mais de uma página', async () => {
    const blob = await gerarPdf(montarDocumento(sim, resultado, QUANDO))
    const conteudo = new TextDecoder('latin1').decode(await blob.arrayBuffer())
    expect(conteudo.startsWith('%PDF-')).toBe(true)
    expect(Number(conteudo.match(/\/Count (\d+)/)?.[1])).toBeGreaterThan(1)
    expect(conteudo).toContain('NÃO OFICIAL')
    expect(conteudo).toContain('/URI (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14601.htm)')
  })
})
