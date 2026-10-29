import type { Fonte } from './tipos'

export interface MesBolsaFamilia {
  mes: string
  familias: number
  /** Total pago no mês, em reais. */
  total: number
  media: number
  fonte: Fonte
}

const SECOM = 'Secretaria de Comunicação Social da Presidência (Secom)'
const secom = (caminho: string, data: string): Fonte => ({
  titulo: 'Folha de pagamento do Bolsa Família', orgao: SECOM, data,
  url: `https://www.gov.br/secom/pt-br/acompanhe-a-secom/noticias/2026/${caminho}`,
})

/** Folhas mensais de 2026 com total divulgado oficialmente. */
export const BOLSA_FAMILIA_2026: MesBolsaFamilia[] = [
  { mes: '2026-01', familias: 18_770_000, total: 13_100_000_000, media: 697.77, fonte: secom('01/bolsa-familia-chega-a-18-77-milhoes-de-beneficiarios-do-pais-a-partir-desta-segunda-19', '2026-01-19') },
  { mes: '2026-02', familias: 18_840_000, total: 13_000_000_000, media: 690.01, fonte: secom('02/bolsa-familia-chega-a-18-84-milhoes-de-beneficiarios-do-pais-a-partir-desta-quinta-12', '2026-02-12') },
  { mes: '2026-03', familias: 18_730_000, total: 12_760_000_000, media: 683.75, fonte: secom('03/bolsa-familia-alcanca-18-73-milhoes-de-beneficiarios-em-todo-o-brasil-a-partir-desta-quarta-18', '2026-03-18') },
  { mes: '2026-04', familias: 18_900_000, total: 12_800_000_000, media: 678.22, fonte: secom('04/bolsa-familia-chega-a-18-9-milhoes-de-beneficiarios-em-todo-o-brasil-a-partir-desta-quinta-16', '2026-04-16') },
  { mes: '2026-05', familias: 19_080_000, total: 12_900_000_000, media: 678.01, fonte: secom('05/pagamentos-do-bolsa-familia-tem-inicio-nesta-segunda-feira-18-5-para-mais-de-19-08-milhoes-de-familias-em-todo-o-pais', '2026-05-18') },
  { mes: '2026-06', familias: 19_340_000, total: 13_080_000_000, media: 677.66, fonte: secom('06/bolsa-familia-chega-a-19-3-milhoes-de-beneficiarios-em-todo-o-brasil-a-partir-desta-quarta-17', '2026-06-17') },
]

export const TOTAL_BF_2026_DIVULGADO = BOLSA_FAMILIA_2026.reduce((s, m) => s + m.total, 0)

export interface Destaque {
  id: string
  titulo: string
  valor: number
  periodo: string
  detalhe: string
  fonte: Fonte
  /** Valor somado por nós a partir de números oficiais. */
  calculado?: boolean
}

export const DESTAQUES: Destaque[] = [
  {
    id: 'assistencia-2026',
    titulo: 'Gasto federal com Assistência Social',
    valor: 199_550_000_000,
    periodo: '2026 (até a última atualização do Portal)',
    detalhe: 'Valor pago pelo governo federal na função "Assistência Social", que inclui Bolsa Família, BPC e outros. O orçamento atualizado do ano é de R$ 292,17 bilhões.',
    fonte: { titulo: 'Portal da Transparência — Função Assistência Social', url: 'https://portaldatransparencia.gov.br/funcoes/08-assistencia-social', orgao: 'Controladoria-Geral da União (CGU)', data: '2026-10-29' },
  },
  {
    id: 'bf-2026',
    titulo: 'Bolsa Família em 2026',
    valor: TOTAL_BF_2026_DIVULGADO,
    periodo: 'janeiro a junho de 2026',
    detalhe: 'Soma das folhas mensais divulgadas oficialmente. De julho a outubro o governo não divulgou o total da folha.',
    fonte: BOLSA_FAMILIA_2026[5].fonte,
    calculado: true,
  },
  {
    id: 'bf-2025',
    titulo: 'Bolsa Família em 2025',
    valor: 160_000_000_000,
    periodo: 'ano inteiro de 2025',
    detalhe: 'Quase R$ 160 bilhões para cerca de 19,8 milhões de famílias por mês, com média de R$ 680.',
    fonte: { titulo: 'Bolsa Família amplia inclusão e fortalece gestões estaduais e municipais', url: 'https://www.gov.br/mds/pt-br/noticias-e-conteudos/desenvolvimento-social/noticias-desenvolvimento-social/bolsa-familia-amplia-inclusao-e-fortalece-gestoes-estaduais-e-municipais', orgao: 'MDS' },
  },
  {
    id: 'bf-2024',
    titulo: 'Bolsa Família em 2024',
    valor: 168_300_000_000,
    periodo: 'ano inteiro de 2024',
    detalhe: 'Total repassado pelo programa em 2024.',
    fonte: { titulo: 'Governo federal repassa R$ 168,3 bilhões pelo Bolsa Família em 2024', url: 'https://www.gov.br/secom/pt-br/acompanhe-a-secom/noticias/2024/12/governo-federal-repassa-r-168-3-bilhoes-pelo-bolsa-familia-em-2024', orgao: SECOM, data: '2024-12' },
  },
  {
    id: 'pe-de-meia',
    titulo: 'Pé-de-Meia',
    valor: 24_000_000_000,
    periodo: '2024 a 2026',
    detalhe: 'Investimento total para 7,4 milhões de estudantes desde a criação do programa.',
    fonte: { titulo: 'Pé-de-Meia — página oficial', url: 'https://www.gov.br/mec/pt-br/pe-de-meia', orgao: 'MEC', data: '2026-10' },
  },
  {
    id: 'seguro-defeso',
    titulo: 'Seguro-Defeso',
    valor: 3_130_000_000,
    periodo: 'defesos de novembro de 2025 a maio de 2026',
    detalhe: '744.991 pescadores artesanais receberam 1,93 milhão de parcelas.',
    fonte: { titulo: 'MTE repassou 1,9 milhão de parcelas do seguro-defeso', url: 'https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/junho/mte-repassou-1-9-milhoes-de-parcelas-do-seguro-defeso-para-744-991-pescadores-artesanais-em-todo-pais', orgao: 'Ministério do Trabalho e Emprego', data: '2026-06' },
  },
]

export const NUMEROS: { rotulo: string; valor: string; fonte: Fonte }[] = [
  {
    rotulo: 'pessoas recebem BPC (2,74 milhões de idosos e 3,75 milhões de pessoas com deficiência)',
    valor: '6,5 milhões',
    fonte: { titulo: 'Relatório da Rede Federal de Fiscalização do BPC', url: 'https://www.gov.br/mds/pt-br/acoes-e-programas/rede-federal-de-fiscalizacao/Relatorio_RFBC_GT3BPC_2026.pdf', orgao: 'MDS', data: '2025-07' },
  },
  {
    rotulo: 'famílias no Bolsa Família em setembro de 2026',
    valor: '19,29 milhões',
    fonte: { titulo: 'Pagamentos de setembro do Bolsa Família', url: 'https://www.gov.br/mds/pt-br/noticias/bolsa-familia-pagamentos-de-setembro-comecam-nesta-quinta-feira-17-09', orgao: 'MDS', data: '2026-09-17' },
  },
  {
    rotulo: 'famílias atendidas pelo Gás do Povo (maio de 2026)',
    valor: '15,05 milhões',
    fonte: { titulo: 'Informe Gás do Povo nº 02', url: 'https://www.gov.br/mds/pt-br/acoes-e-programas/gas-do-povo/informes/2026/informe_gas_do_povo_n_02.pdf', orgao: 'MDS', data: '2026-05' },
  },
]
