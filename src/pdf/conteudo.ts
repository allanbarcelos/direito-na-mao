/**
 * Monta o conteúdo do PDF da simulação (sem desenhar nada).
 * Fica separado do jsPDF para poder ser testado e para a biblioteca só carregar no clique.
 */
import type { BeneficioCalculado, Pessoa, Resultado } from '../calculo/tipos'
import { NOME_SITE, SITE_URL } from '../config'
import type { Simulacao } from '../estado/simulacao'
import { brl, dataBR } from '../lib/formatar'
import { programaPorId } from '../servicos/catalogo'
import { LOCAL_POR_ID } from '../servicos/locais'
import { DATA_ATUALIZACAO, FONTES_REFERENCIA } from '../servicos/referencias'
import { NOMES_UF, type Fonte } from '../servicos/tipos'

export type Bloco =
  | { tipo: 'titulo'; texto: string }
  | { tipo: 'aviso'; titulo: string; texto: string }
  | { tipo: 'secao'; texto: string }
  | { tipo: 'paragrafo'; texto: string; negrito?: boolean }
  | { tipo: 'destaque'; texto: string; detalhe: string }
  | { tipo: 'lista'; itens: string[]; numerada?: boolean }
  | { tipo: 'beneficio'; titulo: string; valor: string; linhas: string[] }
  | { tipo: 'fontes'; programa: string; fontes: Fonte[] }

export const AVISO_NAO_OFICIAL =
  `Este documento NÃO é oficial e não foi emitido pelo governo. Ele foi gerado pelo ${NOME_SITE}, um guia ` +
  'independente e gratuito, a partir das respostas que você deu no simulador. É apenas uma estimativa para ' +
  'ajudar você a chegar ao CRAS já sabendo o que perguntar. Quem decide se você tem direito a um benefício, ' +
  'e quanto vai receber, é o órgão responsável, depois de analisar o seu Cadastro Único e os seus documentos.'

const ESCOLA: Record<Pessoa['escola'], string> = {
  nao: '', fundamental: 'estuda no ensino fundamental', medio: 'estuda no ensino médio', faculdade: 'faz faculdade',
}

const nomeDe = (p: Pessoa, i: number) => p.nome.trim() || `Pessoa ${i + 1}`

export function descreverPessoa(p: Pessoa, i: number): string {
  const fem = p.sexo === 'feminino'
  const partes = [
    `${p.idade} ${p.idade === 1 ? 'ano' : 'anos'}`,
    p.sexo ? p.sexo : '',
    p.responsavel ? 'responsável pela família' : '',
    p.deficiencia ? `com deficiência${p.zika ? ' (causada pelo vírus Zika)' : ''}` : '',
    p.gestante ? 'grávida' : '',
    p.amamentando ? 'amamentando' : '',
    ESCOLA[p.escola] + (p.escola === 'medio' && p.integral ? ' em tempo integral' : ''),
    p.indigenaQuilombola ? 'indígena ou quilombola' : '',
    p.rendaTrabalho > 0 ? `renda do trabalho de ${brl(p.rendaTrabalho)} por mês${p.trabalhoFormal ? ' (com carteira)' : ''}` : '',
    p.saiuDoBPC ? 'saiu do BPC para trabalhar' : '',
    p.aposentadoria > 0 ? `aposentadoria ou pensão de ${brl(p.aposentadoria)} por mês` : '',
    p.recebeBPC ? 'já recebe BPC' : '',
    p.pescador ? (fem ? 'pescadora artesanal' : 'pescador artesanal') : '',
    p.agricultor ? (fem ? 'agricultora familiar' : 'agricultor familiar') : '',
  ].filter(Boolean)
  return `${nomeDe(p, i)}: ${partes.join(', ')}.`
}

/** Perguntas prontas para a pessoa fazer no atendimento. */
export function montarPerguntas(sim: Simulacao, r: Resultado): string[] {
  const f = sim.familia
  const perguntas: string[] = []
  if (f.cadUnico !== 'sim') {
    perguntas.push('Quero fazer ou atualizar o Cadastro Único da minha família. Quais documentos preciso trazer?')
  } else {
    perguntas.push('O Cadastro Único da minha família está atualizado? Quando preciso atualizar de novo?')
  }

  const vistos = new Set<string>()
  for (const b of r.melhor.beneficios) {
    const chave = `${b.programaId}:${b.pessoa ?? ''}`
    if (vistos.has(chave)) continue
    vistos.add(chave)
    perguntas.push(perguntaSobre(b, sim))
  }

  const pedeMaisBPC = r.alternativas.some((c) => c.bpcPara.length > r.melhor.bpcPara.length)
  if (pedeMaisBPC) {
    perguntas.push('A simulação indicou que pedir o BPC para mais pessoas da casa poderia tirar a família do Bolsa Família. Isso vale no meu caso?')
  }
  for (const b of r.aConfirmar) {
    perguntas.push(`O programa ${b.nome} ainda está pagando? Minha família tem direito?`)
  }
  perguntas.push('Existe algum outro programa da prefeitura ou do estado que a minha família pode receber?')
  return perguntas
}

function perguntaSobre(b: BeneficioCalculado, sim: Simulacao): string {
  const para = b.pessoa ? ` para ${b.pessoa}` : ''
  const jaRecebe = sim.familia.pessoas.some((p, i) => p.recebeBPC && nomeDe(p, i) === b.pessoa)
  switch (b.programaId) {
    case 'bpc':
      return jaRecebe
        ? `BPC${para}: o que preciso fazer para não perder o benefício (CadÚnico, biometria)?`
        : `Posso pedir o BPC${para}? Quais documentos e laudos o INSS vai pedir?`
    case 'bolsa-familia':
      if (b.temporario) return 'Por quanto tempo vou continuar recebendo o Bolsa Família pela Regra de Proteção?'
      return sim.familia.recebeBolsaFamilia
        ? 'O valor do Bolsa Família da minha família está certo pela composição da casa?'
        : 'Como faço para entrar no Bolsa Família e quanto tempo demora?'
    default: {
      const programa = programaPorId(b.programaId)
      const extra = b.temporario ? ' Por quanto tempo recebo?' : ''
      if (programa?.esfera === 'estadual') return `${b.nome}${para}: o programa atende a minha cidade? Como me inscrevo?${extra}`
      return `${b.nome}${para}: tenho direito? Como faço para pedir?${extra}`
    }
  }
}

/** Fontes oficiais agrupadas por programa (só dos benefícios que aparecem na simulação). */
export function montarFontes(r: Resultado): { programa: string; fontes: Fonte[] }[] {
  const ids = [...new Set([...r.melhor.beneficios, ...r.aConfirmar].map((b) => b.programaId))]
  const grupos = ids.flatMap((id) => {
    const p = programaPorId(id)
    return p ? [{ programa: p.nome, fontes: p.fontes }] : []
  })
  return [{ programa: 'Valores de referência (salário mínimo, Bolsa Família, BPC)', fontes: FONTES_REFERENCIA }, ...grupos]
}

export function montarDocumento(sim: Simulacao, r: Resultado, quando: Date): Bloco[] {
  const f = sim.familia
  const m = r.melhor
  const temporarios = m.totalComTemporarios - m.totalPermanente
  const hoje = quando.toISOString().slice(0, 10)
  const blocos: Bloco[] = [
    { tipo: 'titulo', texto: `Simulação de benefícios sociais — ${dataBR(hoje)}` },
    { tipo: 'aviso', titulo: 'ATENÇÃO: ESTE NÃO É UM DOCUMENTO OFICIAL', texto: AVISO_NAO_OFICIAL },
    {
      tipo: 'paragrafo',
      texto: 'Para que serve: leve este papel ao CRAS (ou mostre no celular) para fazer as perguntas da seção ' +
        '"Perguntas para fazer no CRAS" e conferir se os dados abaixo batem com o seu Cadastro Único.',
    },
    { tipo: 'secao', texto: 'Resultado da simulação' },
    m.beneficios.length > 0
      ? {
          tipo: 'destaque',
          texto: `${r.pessoas > 1 ? 'A família pode receber' : 'Você pode receber'} cerca de ${brl(m.totalPermanente)} por mês`,
          detalhe: [
            `Cerca de ${brl(Math.round(m.totalPermanente * 12))} por ano, somando ${m.beneficios.length} benefício(s).`,
            temporarios > 0 ? `Mais ${brl(temporarios)} por mês por tempo limitado.` : '',
            `Renda por pessoa usada no cálculo: ${brl(r.rendaPorPessoa)}.`,
          ].filter(Boolean).join(' '),
        }
      : { tipo: 'paragrafo', texto: 'Pelas respostas, não encontramos benefícios de transferência de renda. Mesmo assim, vale procurar o CRAS.', negrito: true },
    ...m.beneficios.map((b): Bloco => ({
      tipo: 'beneficio',
      titulo: `${b.nome}${b.pessoa ? ` — ${b.pessoa}` : ''} (${b.esfera === 'federal' ? 'federal' : 'estadual'})`,
      valor: b.valorTexto + (b.temporario ? ` — temporário: ${b.temporario}` : ''),
      linhas: [`Por quê: ${b.motivo}`, ...b.avisos.map((a) => `Atenção: ${a}`)],
    })),
  ]

  if (r.aConfirmar.length) {
    blocos.push(
      { tipo: 'secao', texto: 'Programas a confirmar (fora da soma)' },
      { tipo: 'paragrafo', texto: 'Estes programas existem em lei, mas não encontramos prova oficial de pagamento recente. Pergunte no CRAS.' },
      { tipo: 'lista', itens: r.aConfirmar.map((b) => `${b.nome}${b.pessoa ? ` (${b.pessoa})` : ''}: ${b.valorTexto}`) },
    )
  }

  blocos.push(
    { tipo: 'secao', texto: 'Perguntas para fazer no CRAS' },
    { tipo: 'lista', itens: montarPerguntas(sim, r), numerada: true },
    { tipo: 'secao', texto: 'O que fazer' },
    { tipo: 'lista', itens: r.dicas, numerada: true },
  )

  const onde = [...new Set(m.beneficios.flatMap((b) => programaPorId(b.programaId)?.onde ?? []))]
    .map((id) => LOCAL_POR_ID[id]).filter(Boolean)
  if (onde.length) {
    blocos.push(
      { tipo: 'secao', texto: 'Onde ir' },
      { tipo: 'lista', itens: onde.map((l) => `${l.nome}${l.telefone ? ` (telefone ${l.telefone}, gratuito)` : ''}: ${l.comoAchar}`) },
    )
  }

  blocos.push(
    { tipo: 'secao', texto: 'Dados informados na simulação' },
    {
      tipo: 'lista',
      itens: [
        `Estado: ${f.uf ? NOMES_UF[f.uf] : 'não informado'}`,
        `Pessoas na casa: ${f.pessoas.length}`,
        `Cadastro Único: ${{ sim: 'tem, atualizado', desatualizado: 'tem, mas desatualizado', nao: 'não tem ou não sabe' }[f.cadUnico]}`,
        `Recebe Bolsa Família hoje: ${f.recebeBolsaFamilia ? 'sim' : 'não'}`,
        ...(f.semiarido ? ['Mora no semiárido'] : []),
        ...(f.reservaOuAssentamento ? ['Mora em reserva, floresta protegida ou assentamento'] : []),
      ],
    },
    { tipo: 'lista', itens: f.pessoas.map(descreverPessoa) },
    { tipo: 'secao', texto: 'Fontes oficiais usadas no cálculo' },
    { tipo: 'paragrafo', texto: `Valores e regras conferidos em ${dataBR(DATA_ATUALIZACAO)} nas leis e páginas oficiais abaixo. Leis e valores podem mudar; confirme sempre no atendimento.` },
    ...montarFontes(r).map((g): Bloco => ({ tipo: 'fontes', programa: g.programa, fontes: g.fontes })),
    { tipo: 'paragrafo', texto: `Gerado em ${dataBR(hoje)} por ${NOME_SITE} (${SITE_URL}), guia independente e gratuito. Nenhum dado desta simulação foi enviado para a internet.` },
  )
  return blocos
}
