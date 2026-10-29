import type { Avaliacao, Contexto } from '../calculo/tipos'
import { DATA_ATUALIZACAO as C, MEIO_SALARIO, SALARIO_MINIMO } from './referencias'
import type { Programa, UF } from './tipos'

export interface ProgramaEstadual extends Programa {
  uf: UF
  /** Devolve o que a família recebe deste programa (lista vazia = não tem direito). */
  avaliar: (ctx: Contexto) => Avaliacao[]
}

// ---------- ajudantes ----------
const nome = (ctx: Contexto, i: number) => ctx.familia.pessoas[i].nome.trim() || `Pessoa ${i + 1}`
const temCrianca = (ctx: Contexto, idadeMaxima: number) => ctx.familia.pessoas.some((p) => p.idade <= idadeMaxima)
const temGestante = (ctx: Contexto) => ctx.familia.pessoas.some((p) => p.gestante)
const contar = (ctx: Contexto, f: (p: Contexto['familia']['pessoas'][number]) => boolean) => ctx.familia.pessoas.filter(f).length
const rendaComBF = (ctx: Contexto) => (ctx.rendaFamiliar + ctx.bolsaFamilia) / ctx.n
const ate = (ctx: Contexto, limite: number) => ctx.rendaPorPessoa <= limite
const reais = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 })}`

function porEstudante(
  ctx: Contexto,
  filtro: (p: Contexto['familia']['pessoas'][number]) => boolean,
  valor: (p: Contexto['familia']['pessoas'][number]) => number,
  motivo: string,
  avisos: string[] = [],
): Avaliacao[] {
  return ctx.familia.pessoas.flatMap((p, i) => {
    if (!filtro(p)) return []
    const v = valor(p)
    return [{ valorMensal: v, valorTexto: `${reais(v)} por mês`, motivo, pessoa: nome(ctx, i), avisos }]
  })
}

const AVISO_VAGAS = 'O número de vagas é limitado e a seleção é feita pelo governo do estado.'

export const PROGRAMAS_ESTADUAIS: ProgramaEstadual[] = [
  // ===================== NORDESTE =====================
  {
    id: 'ce-ceara-sem-fome', uf: 'CE', nome: 'Cartão Ceará Sem Fome', esfera: 'estadual', categoria: 'dinheiro', icone: '🍽️',
    resumo: 'R$ 300 por mês para comprar comida, para famílias do Bolsa Família em extrema pobreza.',
    valorTexto: 'R$ 300 por mês',
    paraQuem: ['Famílias do Bolsa Família no Ceará com renda de até R$ 218 por pessoa (contando o Bolsa Família).', 'Prioridade para mulheres chefes de família com crianças até 14 anos.'],
    regras: ['Só pode ser usado para comprar alimentos.', 'CadÚnico atualizado nos últimos 2 anos.'],
    comoPedir: ['A seleção é automática pelo CadÚnico. Mantenha o cadastro em dia no CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [
      { titulo: 'Ceará Sem Fome — site oficial', url: 'https://www.cearasemfome.ce.gov.br', orgao: 'Governo do Ceará' },
      { titulo: 'Governo inclui mais de 16 mil novas famílias no Cartão Ceará Sem Fome 2026', url: 'https://www.sps.ce.gov.br/2026/04/28/governo-do-ceara-inclui-mais-de-16-mil-novas-familias-no-cartao-ceara-sem-fome-2026/', orgao: 'Secretaria da Proteção Social (CE)', data: '2026-04-28' },
    ],
    avaliar: (ctx) => ctx.recebeBolsaFamilia && rendaComBF(ctx) <= 218
      ? [{ valorMensal: 300, valorTexto: 'R$ 300 por mês', motivo: 'Família do Bolsa Família no Ceará ainda abaixo de R$ 218 por pessoa.', avisos: ['Só para comprar alimentos.', AVISO_VAGAS] }]
      : [],
  },
  {
    id: 'ce-mais-infancia', uf: 'CE', nome: 'Cartão Mais Infância Ceará', esfera: 'estadual', categoria: 'dinheiro', icone: '🧒',
    resumo: 'R$ 100 por mês para famílias muito pobres com crianças pequenas.',
    valorTexto: 'R$ 100 por mês',
    paraQuem: ['Famílias no CadÚnico com crianças de 0 a 5 anos e 11 meses.', 'Renda de até R$ 89 por pessoa, sem contar o Bolsa Família.'],
    regras: ['Pode ser somado com o Bolsa Família.'],
    comoPedir: ['Seleção automática pelo CadÚnico.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Mais Infância Ceará', url: 'https://www.sps.ce.gov.br/institucional/secretarias-executivas/infancia-familia-e-combate-a-fome/mais-infancia-ceara-destaque/', orgao: 'Secretaria da Proteção Social (CE)' }],
    avaliar: (ctx) => temCrianca(ctx, 5) && ate(ctx, 89)
      ? [{ valorMensal: 100, valorTexto: 'R$ 100 por mês', motivo: 'Criança de até 5 anos e renda de até R$ 89 por pessoa.' }]
      : [],
  },
  {
    id: 'ma-livre-da-fome', uf: 'MA', nome: 'Maranhão Livre da Fome', esfera: 'estadual', categoria: 'dinheiro', icone: '🍽️',
    resumo: 'Complemento ao Bolsa Família para famílias que continuam na extrema pobreza.',
    valorTexto: 'R$ 200 + R$ 50 por criança de 0 a 6 anos',
    paraQuem: ['Famílias do Bolsa Família no Maranhão com renda de até R$ 218 por pessoa.', 'Moradores dos municípios atendidos (o programa está sendo ampliado).'],
    regras: ['O governo anunciou aumento do valor base para R$ 300 e adicional por pessoa com deficiência; confira o valor atual no site oficial.', 'Bônus de R$ 200 ao concluir curso de qualificação.'],
    comoPedir: ['Seleção pelo CadÚnico nos municípios atendidos. Procure o CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Maranhão Livre da Fome — site oficial', url: 'https://maranhaolivredafome.ma.gov.br', orgao: 'Governo do Maranhão' }],
    avaliar: (ctx) => {
      if (!ctx.recebeBolsaFamilia || !ate(ctx, 218)) return []
      const v = 200 + 50 * contar(ctx, (p) => p.idade < 7)
      return [{ valorMensal: v, valorTexto: `${reais(v)} por mês`, motivo: 'Família do Bolsa Família no Maranhão abaixo de R$ 218 por pessoa.', avisos: ['Só em municípios atendidos.', 'Valor pode ser maior (aumento anunciado para R$ 300 de base).'] }]
    },
  },
  {
    id: 'pe-maes-de-pernambuco', uf: 'PE', nome: 'Mães de Pernambuco', esfera: 'estadual', categoria: 'dinheiro', icone: '🤱',
    resumo: 'R$ 300 por mês para mães do Bolsa Família com filhos pequenos ou grávidas.',
    valorTexto: 'R$ 300 por mês por família',
    paraQuem: ['Mulher responsável pela família no Bolsa Família.', 'Grávida ou com filho de 0 a 6 anos.', 'Sem emprego com carteira assinada.'],
    regras: ['Cai na mesma conta do Bolsa Família e não diminui o Bolsa Família.', 'Abre ciclos de inscrição com número limitado de vagas.'],
    comoPedir: ['Inscrição no site oficial quando o ciclo estiver aberto, ou com ajuda do CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Mães de Pernambuco — site oficial', url: 'https://maesdepernambuco.pe.gov.br', orgao: 'Governo de Pernambuco' }],
    avaliar: (ctx) => {
      const mae = ctx.familia.pessoas.some((p) => p.responsavel && !p.trabalhoFormal)
      return ctx.recebeBolsaFamilia && mae && (temGestante(ctx) || temCrianca(ctx, 6))
        ? [{ valorMensal: 300, valorTexto: 'R$ 300 por mês', motivo: 'Mãe responsável no Bolsa Família, grávida ou com criança de até 6 anos.', avisos: [AVISO_VAGAS] }]
        : []
    },
  },
  {
    id: 'al-cria', uf: 'AL', nome: 'Cartão CRIA (Criança Alagoana)', esfera: 'estadual', categoria: 'dinheiro', icone: '👶',
    resumo: 'R$ 150 por mês para gestantes e famílias pobres com crianças de até 6 anos.',
    valorTexto: 'R$ 150 por mês + 13ª parcela',
    paraQuem: ['Gestantes ou responsáveis por crianças de 0 a 6 anos.', 'CadÚnico com renda de até R$ 218 por pessoa.'],
    regras: ['Gêmeos: R$ 300 por mês.', 'Tem 13ª parcela no fim do ano.'],
    comoPedir: ['Procure o CRAS. A seleção usa o CadÚnico.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'CRIA — Criança Alagoana', url: 'https://alagoas.al.gov.br/programa/cria-crianca-alagoana', orgao: 'Governo de Alagoas' }],
    avaliar: (ctx) => (temGestante(ctx) || temCrianca(ctx, 6)) && ate(ctx, 218)
      ? [{ valorMensal: 162.5, valorTexto: 'R$ 150 por mês + 13ª', motivo: 'Gestante ou criança de até 6 anos em família de baixa renda.', avisos: ['A média mensal inclui a 13ª parcela.'] }]
      : [],
  },
  {
    id: 'al-escola-10', uf: 'AL', nome: 'Cartão Escola 10', esfera: 'estadual', categoria: 'poupanca', icone: '🎒',
    resumo: 'Bolsa para todos os alunos do ensino médio da rede estadual de Alagoas, sem limite de renda.',
    valorTexto: 'R$ 100 por mês (R$ 150 integral) + R$ 2.000 ao concluir',
    paraQuem: ['Estudantes do ensino médio e EJA da rede estadual de Alagoas.', 'Não depende da renda da família.'],
    regras: ['Precisa de 90% de presença.', 'Bolsa Conclusão de R$ 2.000 ao terminar o ensino médio.'],
    comoPedir: ['É automático para alunos matriculados. Pagamento por Pix no CPF do estudante.'],
    onde: ['escola'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Cartão Escola 10', url: 'https://www.educacao.al.gov.br/estudante/cartao-escola-10', orgao: 'Secretaria de Educação de Alagoas' }],
    avaliar: (ctx) => porEstudante(ctx, (p) => p.escola === 'medio', (p) => (p.integral ? 150 : 100), 'Estuda no ensino médio da rede estadual.', ['Precisa de 90% de presença.', 'Mais R$ 2.000 ao concluir o ensino médio.']),
  },
  {
    id: 'ba-bolsa-presenca', uf: 'BA', nome: 'Bolsa Presença', esfera: 'estadual', categoria: 'dinheiro', icone: '🏫',
    resumo: 'Dinheiro para famílias pobres manterem os filhos na escola estadual da Bahia.',
    valorTexto: 'R$ 150 por família + R$ 50 por estudante a mais',
    paraQuem: ['Famílias no CadÚnico em situação de pobreza com estudantes na rede estadual da Bahia.'],
    regras: ['O estudante precisa ter frequência escolar.'],
    comoPedir: ['É automático para estudantes da rede estadual com família no CadÚnico.'],
    onde: ['escola', 'cras'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Bolsa Presença', url: 'https://www.ba.gov.br/educacao/bolsa-presenca', orgao: 'Secretaria da Educação da Bahia' }],
    avaliar: (ctx) => {
      const k = contar(ctx, (p) => p.escola === 'fundamental' || p.escola === 'medio')
      if (k === 0 || !ate(ctx, 218)) return []
      const v = 150 + 50 * (k - 1)
      return [{ valorMensal: v, valorTexto: `${reais(v)} por mês`, motivo: `${k} estudante(s) na escola pública e renda baixa.`, avisos: ['Vale para alunos da rede estadual.'] }]
    },
  },
  {
    id: 'ba-mais-futuro', uf: 'BA', nome: 'Mais Futuro', esfera: 'estadual', categoria: 'dinheiro', icone: '🎓',
    resumo: 'Bolsa para estudantes de baixa renda das universidades estaduais da Bahia.',
    valorTexto: 'R$ 400 por mês (R$ 800 se mora longe da família)',
    paraQuem: ['Alunos da UNEB, UESB, UEFS ou UESC com renda de até meio salário mínimo por pessoa.'],
    regras: ['Inscrição por edital.'],
    comoPedir: ['Acompanhe o edital na sua universidade.'],
    onde: ['universidade'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Edital SEC nº 15/2026 — Mais Futuro', url: 'https://www.uesb.br/wp-content/uploads/2026/08/EDITAL-SEC-No-15_2026-Mais-Futuro.pdf', orgao: 'Secretaria da Educação da Bahia / UESB', data: '2026-08' }],
    avaliar: (ctx) => ate(ctx, MEIO_SALARIO)
      ? porEstudante(ctx, (p) => p.escola === 'faculdade', () => 400, 'Universitário de baixa renda (só em universidade estadual da Bahia).', ['Só para UNEB, UESB, UEFS e UESC.'])
      : [],
  },
  {
    id: 'se-cmais', uf: 'SE', nome: 'CMais (Cartão Mais Inclusão)', esfera: 'estadual', categoria: 'dinheiro', icone: '💳',
    resumo: 'Conjunto de cartões de ajuda do governo de Sergipe para crianças, mães e mulheres.',
    valorTexto: 'R$ 130 por mês (Ser Criança)',
    paraQuem: ['CMais Ser Criança: famílias no CadÚnico com crianças de 0 a 6 anos.', 'Outras linhas: mães solo, mulheres vítimas de violência, feirantes.'],
    regras: ['Vagas limitadas.'],
    comoPedir: ['Procure o CRAS ou a Secretaria de Assistência Social de Sergipe.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'confirmar', conferido: C,
    observacao: 'Valores de 2026 não confirmados em página oficial.',
    fontes: [{ titulo: 'Programa CMais ultrapassa R$ 100 milhões investidos', url: 'https://www.se.gov.br/agencia/noticias/assistencia-social/programa_cmais_inclusao_ultrapassa_r_100_milhoes_investidos_e_alcanca_mais_de_750_mil_beneficios_pagos_em_sergipe', orgao: 'Governo de Sergipe' }],
    avaliar: (ctx) => temCrianca(ctx, 6) && ate(ctx, 218)
      ? [{ valorMensal: 130, valorTexto: 'R$ 130 por mês', motivo: 'Criança de até 6 anos no CadÚnico.' }]
      : [],
  },
  {
    id: 'pi-cartao-social', uf: 'PI', nome: 'Cartão Social Piauí', esfera: 'estadual', categoria: 'dinheiro', icone: '💳',
    resumo: 'Seis parcelas de R$ 200 por ano para famílias muito pobres do Piauí.',
    valorTexto: '6 × R$ 200 por ano',
    paraQuem: ['Famílias no CadÚnico com renda de até R$ 218 por pessoa, em municípios que aderiram.'],
    regras: ['A lei limita a soma com outros benefícios assistenciais (exceto famílias grandes).'],
    comoPedir: ['Seleção pelo município. Procure o CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'incerto', status: 'confirmar', conferido: C,
    fontes: [{ titulo: 'Seleção das famílias para o Cartão Social', url: 'https://www.pi.gov.br/selecao-das-familias-para-receber-o-cartao-social-deve-comecar-em-agosto/', orgao: 'Governo do Piauí' }],
    avaliar: (ctx) => ate(ctx, 218)
      ? [{ valorMensal: 100, valorTexto: '6 × R$ 200 por ano', motivo: 'Renda de até R$ 218 por pessoa.', frequencia: 'anual' }]
      : [],
  },
  {
    id: 'pb-cartao-alimentacao', uf: 'PB', nome: 'Cartão Alimentação Paraíba', esfera: 'estadual', categoria: 'dinheiro', icone: '🍽️',
    resumo: 'R$ 50 por mês para comprar comida, para famílias em vulnerabilidade na Paraíba.',
    valorTexto: 'R$ 50 por mês',
    paraQuem: ['Famílias no CadÚnico em situação de vulnerabilidade na Paraíba.'],
    regras: ['Só para alimentos.', 'Lei estadual nº 12.166/2021.'],
    comoPedir: ['Seleção pelo CadÚnico. Atualize o cadastro no CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Cartão Alimentação — atualização cadastral', url: 'https://paraiba.pb.gov.br/noticias/cartao-alimentacao-nove-cidades-realizam-atualizacao-cadastral-a-partir-desta-terca-feira-11', orgao: 'Governo da Paraíba' }],
    avaliar: (ctx) => ate(ctx, 218)
      ? [{ valorMensal: 50, valorTexto: 'R$ 50 por mês', motivo: 'Família no CadÚnico de baixa renda.', avisos: ['Só para alimentos.'] }]
      : [],
  },
  // ===================== NORTE =====================
  {
    id: 'am-auxilio-estadual', uf: 'AM', nome: 'Auxílio Estadual Permanente', esfera: 'estadual', categoria: 'dinheiro', icone: '💳',
    resumo: 'R$ 150 por mês para famílias pobres do Amazonas.',
    valorTexto: 'R$ 150 por mês',
    paraQuem: ['Famílias no CadÚnico em situação de pobreza ou extrema pobreza no Amazonas.'],
    regras: ['Lei estadual nº 5.665/2021.'],
    comoPedir: ['Seleção pelo CadÚnico. Procure o CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Secretaria de Assistência Social do Amazonas', url: 'https://www.seas.am.gov.br', orgao: 'Governo do Amazonas' }],
    avaliar: (ctx) => ate(ctx, 218)
      ? [{ valorMensal: 150, valorTexto: 'R$ 150 por mês', motivo: 'Família pobre no CadÚnico do Amazonas.' }]
      : [],
  },
  {
    id: 'to-cartao-alimento', uf: 'TO', nome: 'Cartão AlimenTO', esfera: 'estadual', categoria: 'dinheiro', icone: '🍽️',
    resumo: 'R$ 250 por mês para comprar comida, por 12 meses.',
    valorTexto: 'R$ 250 por mês',
    paraQuem: ['Famílias no CadÚnico, moradoras do Tocantins, selecionadas pelo estado (cerca de 7 mil).'],
    regras: ['Pago de dezembro de 2025 a dezembro de 2026.', 'A lei permite somar com o Bolsa Família.'],
    comoPedir: ['Seleção pelo CadÚnico. Procure o CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Governo do Tocantins — Secom', url: 'https://www.to.gov.br/secom', orgao: 'Governo do Tocantins' }],
    avaliar: (ctx) => ate(ctx, 218)
      ? [{ valorMensal: 250, valorTexto: 'R$ 250 por mês', motivo: 'Família de baixa renda no CadÚnico do Tocantins.', avisos: [AVISO_VAGAS, 'Só para alimentos.'], temporario: 'até dez/2026' }]
      : [],
  },
  {
    id: 'rr-cesta-da-familia', uf: 'RR', nome: 'Cesta da Família', esfera: 'estadual', categoria: 'dinheiro', icone: '🧺',
    resumo: 'R$ 200 por mês em cartão (ou cesta básica) para famílias de baixa renda de Roraima.',
    valorTexto: 'R$ 200 por mês',
    paraQuem: ['Famílias com renda de até meio salário mínimo por pessoa em Roraima.'],
    regras: ['Há proposta de aumento para R$ 400 a partir de 2027 (não confirmada).'],
    comoPedir: ['Procure a SETRABES ou o CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'SETRABES — Roraima', url: 'https://setrabes.rr.gov.br', orgao: 'Governo de Roraima' }],
    avaliar: (ctx) => ate(ctx, MEIO_SALARIO)
      ? [{ valorMensal: 200, valorTexto: 'R$ 200 por mês', motivo: 'Renda de até meio salário mínimo por pessoa.' }]
      : [],
  },
  {
    id: 'ap-renda-viver-melhor', uf: 'AP', nome: 'Renda para Viver Melhor', esfera: 'estadual', categoria: 'dinheiro', icone: '💳',
    resumo: 'Pela lei, meio salário mínimo por mês para famílias muito pobres do Amapá.',
    valorTexto: 'Meio salário mínimo por mês (pela lei)',
    paraQuem: ['Famílias com renda de até 1/4 do salário mínimo por pessoa.'],
    regras: ['Permanência de até 2 anos (+1).', 'Lei estadual nº 1.598/2011.'],
    comoPedir: ['Procure a Secretaria de Inclusão e Mobilização Social (SIMS).'],
    onde: ['estado', 'cras'], acumulaBolsaFamilia: 'sim', status: 'confirmar', conferido: C,
    observacao: 'Não encontramos pagamento confirmado em 2025/2026.',
    fontes: [{ titulo: 'Renda para Viver Melhor — SIMS', url: 'https://sims.portal.ap.gov.br/conteudo/servicos/renda-para-viver-melhor', orgao: 'Governo do Amapá' }],
    avaliar: (ctx) => ate(ctx, SALARIO_MINIMO / 4)
      ? [{ valorMensal: MEIO_SALARIO, valorTexto: `${reais(MEIO_SALARIO)} por mês`, motivo: 'Renda de até 1/4 do salário mínimo por pessoa.' }]
      : [],
  },
  // ===================== SUDESTE =====================
  {
    id: 'sp-superacao', uf: 'SP', nome: 'SuperAção SP', esfera: 'estadual', categoria: 'dinheiro', icone: '🚀',
    resumo: 'Dinheiro por pessoa da família, mais bônus por curso e emprego, para sair da pobreza.',
    valorTexto: 'R$ 150,33 por pessoa, por mês',
    paraQuem: ['Famílias no CadÚnico com renda de até R$ 218 por pessoa, nos municípios participantes.'],
    regras: [
      'Pago por 6 meses, podendo ser renovado por mais 6.',
      'Bônus únicos: R$ 200 ao assinar o plano da família, R$ 600 de capacitação e outros por curso e emprego.',
      'Lei estadual nº 18.176 e Decreto nº 69.762.',
    ],
    comoPedir: ['Procure o CRAS do seu município para saber se ele participa.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'SuperAção SP — site oficial', url: 'https://www.superacaosp.sp.gov.br', orgao: 'Governo de São Paulo' }],
    avaliar: (ctx) => {
      if (!ate(ctx, 218)) return []
      const v = Math.round(150.33 * ctx.n * 100) / 100
      return [{ valorMensal: v, valorTexto: `${reais(v)} por mês`, motivo: `${ctx.n} pessoa(s) × R$ 150,33.`, avisos: ['Só nos municípios participantes.', AVISO_VAGAS], temporario: '6 a 12 meses' }]
    },
  },
  {
    id: 'es-bolsa-capixaba', uf: 'ES', nome: 'Bolsa Capixaba', esfera: 'estadual', categoria: 'dinheiro', icone: '💳',
    resumo: 'Dinheiro todo mês para famílias muito pobres do Espírito Santo que NÃO recebem Bolsa Família.',
    valorTexto: 'De R$ 50 a R$ 600 por mês (varia)',
    paraQuem: ['Famílias no CadÚnico com renda de até R$ 155 por pessoa.', 'Que não recebem Bolsa Família.'],
    regras: ['O valor depende da renda e do tamanho da família.'],
    comoPedir: ['Seleção pelo CadÚnico. Procure o CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'nao', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Acessar o benefício do Bolsa Capixaba', url: 'https://setades.es.gov.br/Acessar-o-beneficio-do-Bolsa-Capixaba', orgao: 'Governo do Espírito Santo' }],
    avaliar: (ctx) => !ctx.recebeBolsaFamilia && ate(ctx, 155)
      ? [{ valorMensal: 50, valorTexto: 'R$ 50 a R$ 600 por mês', motivo: 'Renda de até R$ 155 por pessoa, sem Bolsa Família.', avisos: ['Na soma usamos o valor mínimo (R$ 50). O valor real depende da família.'] }]
      : [],
  },
  // ===================== SUL =====================
  {
    id: 'pr-comida-boa', uf: 'PR', nome: 'Cartão Comida Boa', esfera: 'estadual', categoria: 'dinheiro', icone: '🍽️',
    resumo: 'R$ 80 por mês para comprar comida, para famílias pobres do Paraná.',
    valorTexto: 'R$ 80 por mês',
    paraQuem: ['Famílias no CadÚnico em pobreza ou extrema pobreza no Paraná.', 'Prioridade para quem não recebe Bolsa Família.'],
    regras: ['Crédito todo dia 25.', 'Só para alimentos.', 'Lei estadual nº 20.747/2021.'],
    comoPedir: ['Seleção pelo CadÚnico. Procure o CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'incerto', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Comida Boa', url: 'https://www.desenvolvimentosocial.pr.gov.br/ComidaBoa', orgao: 'Governo do Paraná' }],
    avaliar: (ctx) => ate(ctx, 218)
      ? [{ valorMensal: 80, valorTexto: 'R$ 80 por mês', motivo: 'Família pobre no CadÚnico.', avisos: ctx.recebeBolsaFamilia ? ['Quem não recebe Bolsa Família tem prioridade.'] : [] }]
      : [],
  },
  {
    id: 'rs-todo-jovem-na-escola', uf: 'RS', nome: 'Todo Jovem na Escola', esfera: 'estadual', categoria: 'poupanca', icone: '🎒',
    resumo: 'Bolsa mensal para estudantes de baixa renda do ensino médio estadual do RS.',
    valorTexto: 'R$ 150 por mês (R$ 225 integral ou técnico)',
    paraQuem: ['Estudantes do ensino médio estadual até 21 anos (EJA até 29).', 'Família no CadÚnico com renda de até R$ 660 por pessoa.'],
    regras: ['Paga de março a dezembro.', '75% de presença.', 'Extras: R$ 150 de material, R$ 300 por etapa concluída (poupança).'],
    comoPedir: ['É automático para alunos com família no CadÚnico. Confira na escola.'],
    onde: ['escola', 'cras'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Secretaria da Educação do RS', url: 'https://educacao.rs.gov.br', orgao: 'Governo do Rio Grande do Sul' }],
    avaliar: (ctx) => ate(ctx, 660)
      ? porEstudante(ctx, (p) => p.escola === 'medio' && p.idade <= 21, (p) => (p.integral ? 225 : 150) * 10 / 12, 'Estudante do ensino médio estadual com família de baixa renda.', ['Pago em 10 meses (março a dezembro); a soma mostra a média mensal.'])
      : [],
  },
  {
    id: 'sc-bolsa-estudante', uf: 'SC', nome: 'Bolsa Estudante', esfera: 'estadual', categoria: 'dinheiro', icone: '🎒',
    resumo: 'Bolsa para estudantes do ensino médio estadual de famílias do CadÚnico em Santa Catarina.',
    valorTexto: 'R$ 568,18 por mês (11 meses)',
    paraQuem: ['Estudantes do ensino médio ou EJA da rede estadual com família no CadÚnico.', 'No máximo 2 por família.'],
    regras: ['75% de presença.', 'Lei estadual nº 18.338/2022.'],
    comoPedir: ['Pela escola, conforme edital da Secretaria de Educação.'],
    onde: ['escola'], acumulaBolsaFamilia: 'sim', status: 'confirmar', conferido: C,
    observacao: 'A página oficial fala em pagamentos garantidos até 2024. Não confirmamos se continua em 2026.',
    fontes: [{ titulo: 'Bolsa Estudante — SED/SC', url: 'https://www.sed.sc.gov.br/programas-e-projetos/bolsa-estudante/', orgao: 'Secretaria de Educação de SC' }],
    avaliar: (ctx) => porEstudante(ctx, (p) => p.escola === 'medio', () => 568.18 * 11 / 12, 'Estudante do ensino médio estadual com família no CadÚnico.').slice(0, 2),
  },
  // ===================== CENTRO-OESTE =====================
  {
    id: 'ms-mais-social', uf: 'MS', nome: 'Mais Social', esfera: 'estadual', categoria: 'dinheiro', icone: '💳',
    resumo: 'R$ 450 por mês em cartão para comida, gás e higiene, para famílias de baixa renda de MS.',
    valorTexto: 'R$ 450 por mês',
    paraQuem: ['Famílias no CadÚnico com renda de até meio salário mínimo por pessoa.'],
    regras: ['Pode usar em alimentos, gás e produtos de higiene.', 'Pode ter parcela extra em dezembro.', 'Lei estadual nº 6.151/2023.'],
    comoPedir: ['Peça pelo site da SEAD ou no CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'incerto', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Solicitar inclusão no programa Mais Social', url: 'https://www.sead.ms.gov.br/servicos-em-destaque/solicitar-inclusao-no-programa-mais-social/', orgao: 'Governo de Mato Grosso do Sul' }],
    avaliar: (ctx) => ate(ctx, MEIO_SALARIO)
      ? [{ valorMensal: 450, valorTexto: 'R$ 450 por mês', motivo: 'Renda de até meio salário mínimo por pessoa.', avisos: [AVISO_VAGAS] }]
      : [],
  },
  {
    id: 'mt-ser-familia', uf: 'MT', nome: 'Ser Família', esfera: 'estadual', categoria: 'dinheiro', icone: '💳',
    resumo: 'Cartões de ajuda mensal para famílias em extrema pobreza de Mato Grosso.',
    valorTexto: 'A partir de R$ 150 por mês',
    paraQuem: ['Famílias em extrema pobreza no CadÚnico.', 'Linhas: Família, Criança, Idoso, Mulher, Inclusivo, Indígena.'],
    regras: ['Lei estadual nº 10.523/2017, alterada pela Lei nº 13.344/2026.'],
    comoPedir: ['Procure o CRAS ou a SETASC.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'incerto', status: 'confirmar', conferido: C,
    observacao: 'O valor de 2026 não foi confirmado em página oficial.',
    fontes: [{ titulo: 'SETASC — Mato Grosso', url: 'https://www.setasc.mt.gov.br', orgao: 'Governo de Mato Grosso' }],
    avaliar: (ctx) => ate(ctx, 218)
      ? [{ valorMensal: 150, valorTexto: 'A partir de R$ 150 por mês', motivo: 'Família em extrema pobreza.' }]
      : [],
  },
  {
    id: 'go-bolsa-estudo', uf: 'GO', nome: 'Bolsa Estudo', esfera: 'estadual', categoria: 'dinheiro', icone: '🎒',
    resumo: 'Bolsa para todos os alunos do 9º ano e do ensino médio da rede estadual de Goiás.',
    valorTexto: 'R$ 130 por mês (R$ 150 integral)',
    paraQuem: ['Alunos do 9º ano e do ensino médio da rede estadual de Goiás.', 'Não depende da renda.'],
    regras: ['10 parcelas no ano letivo.', '75% de presença, notas mínimas e sem infrações disciplinares.', 'Decreto estadual nº 10.841/2025.'],
    comoPedir: ['É automático para alunos matriculados.'],
    onde: ['escola'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [
      { titulo: 'Bolsa Estudo — Goiás Social', url: 'https://www.goiassocial.go.gov.br/programa/bolsa-estudo/', orgao: 'Governo de Goiás' },
      { titulo: 'Decreto nº 10.841, de 20/12/2025', url: 'https://goias.gov.br/educacao/wp-content/uploads/sites/40/2026/01/DECRETO-10.841-DE-20-DE-DEZEMBRO-2025_alteracao-valores-bolsa.pdf', orgao: 'Governo de Goiás', data: '2025-12-20' },
    ],
    avaliar: (ctx) => porEstudante(ctx, (p) => p.escola === 'medio', (p) => (p.integral ? 150 : 130) * 10 / 12, 'Estudante do ensino médio estadual (também vale para o 9º ano).', ['Pago em 10 parcelas; a soma mostra a média mensal.']),
  },
  {
    id: 'go-maes-de-goias', uf: 'GO', nome: 'Mães de Goiás', esfera: 'estadual', categoria: 'dinheiro', icone: '🤱',
    resumo: 'R$ 300 por mês para mães pobres com filhos pequenos que NÃO recebem Bolsa Família.',
    valorTexto: 'R$ 300 por mês',
    paraQuem: ['Mães com filhos de 0 a 6 anos, no CadÚnico, em situação de pobreza.', 'Que não recebem Bolsa Família.'],
    regras: ['Não pode ser somado com o Bolsa Família.'],
    comoPedir: ['Procure o CRAS ou o site Goiás Social.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'nao', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Mães de Goiás: valor reajustado para R$ 300', url: 'https://goias.gov.br/maes-de-goias-valor-sera-reajustado-para-r-300/', orgao: 'Governo de Goiás' }],
    avaliar: (ctx) => !ctx.recebeBolsaFamilia && temCrianca(ctx, 6) && ctx.familia.pessoas.some((p) => p.responsavel) && ate(ctx, MEIO_SALARIO)
      ? [{ valorMensal: 300, valorTexto: 'R$ 300 por mês', motivo: 'Mãe com criança de até 6 anos, sem Bolsa Família.', avisos: ['Não pode ser somado com o Bolsa Família.'] }]
      : [],
  },
  {
    id: 'go-dignidade', uf: 'GO', nome: 'Dignidade', esfera: 'estadual', categoria: 'dinheiro', icone: '🧓',
    resumo: 'R$ 300 por mês para pessoas de 60 a 64 anos em situação de pobreza que NÃO recebem Bolsa Família.',
    valorTexto: 'R$ 300 por mês',
    paraQuem: ['Pessoas de 60 a 64 anos, no CadÚnico, em situação de pobreza.', 'Que não recebem Bolsa Família.'],
    regras: ['Prorrogado para 2026 pelo Decreto estadual nº 10.832/2025.'],
    comoPedir: ['Procure o CRAS ou o site Goiás Social.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'nao', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'Goiás Social', url: 'https://www.goiassocial.go.gov.br', orgao: 'Governo de Goiás' }],
    avaliar: (ctx) => ctx.recebeBolsaFamilia || !ate(ctx, MEIO_SALARIO) ? [] : ctx.familia.pessoas.flatMap((p, i) =>
      p.idade >= 60 && p.idade <= 64 && p.aposentadoria === 0
        ? [{ valorMensal: 300, valorTexto: 'R$ 300 por mês', motivo: 'Tem de 60 a 64 anos e renda baixa, sem Bolsa Família.', pessoa: nome(ctx, i) }]
        : []),
  },
  {
    id: 'df-social', uf: 'DF', nome: 'DF Social', esfera: 'estadual', categoria: 'dinheiro', icone: '💳',
    resumo: 'R$ 150 por mês para famílias de baixa renda do Distrito Federal.',
    valorTexto: 'R$ 150 por mês',
    paraQuem: ['Famílias no CadÚnico com renda de até meio salário mínimo por pessoa.'],
    regras: ['Lei distrital nº 7.008/2021.', 'Depende do orçamento disponível.'],
    comoPedir: ['Procure o CRAS. A seleção usa o CadÚnico.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'SEDES-DF', url: 'https://www.sedes.df.gov.br', orgao: 'Governo do Distrito Federal' }],
    avaliar: (ctx) => ate(ctx, MEIO_SALARIO)
      ? [{ valorMensal: 150, valorTexto: 'R$ 150 por mês', motivo: 'Renda de até meio salário mínimo por pessoa.' }]
      : [],
  },
  {
    id: 'df-prato-cheio', uf: 'DF', nome: 'Cartão Prato Cheio', esfera: 'estadual', categoria: 'dinheiro', icone: '🍽️',
    resumo: 'R$ 250 por mês para comprar comida, para famílias em insegurança alimentar no DF.',
    valorTexto: 'R$ 250 por mês, por 18 meses',
    paraQuem: ['Famílias em situação de insegurança alimentar no Distrito Federal.'],
    regras: ['18 parcelas, sem renovação automática.', 'Só para alimentos.'],
    comoPedir: ['Procure o CRAS.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'SEDES-DF', url: 'https://www.sedes.df.gov.br', orgao: 'Governo do Distrito Federal' }],
    avaliar: (ctx) => ate(ctx, MEIO_SALARIO)
      ? [{ valorMensal: 250, valorTexto: 'R$ 250 por mês', motivo: 'Família de baixa renda em insegurança alimentar.', avisos: ['Só para alimentos.'], temporario: '18 meses' }]
      : [],
  },
  {
    id: 'df-cartao-gas', uf: 'DF', nome: 'Cartão Gás DF', esfera: 'estadual', categoria: 'dinheiro', icone: '🔥',
    resumo: 'R$ 100 a cada 2 meses para ajudar a comprar gás de cozinha no DF.',
    valorTexto: 'R$ 100 a cada 2 meses',
    paraQuem: ['Famílias no CadÚnico de baixa renda no Distrito Federal.'],
    regras: ['Decreto distrital nº 42.376/2021.'],
    comoPedir: ['Seleção pelo CadÚnico.'],
    onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
    fontes: [{ titulo: 'SEDES-DF', url: 'https://www.sedes.df.gov.br', orgao: 'Governo do Distrito Federal' }],
    avaliar: (ctx) => ate(ctx, MEIO_SALARIO)
      ? [{ valorMensal: 50, valorTexto: 'R$ 100 a cada 2 meses', motivo: 'Família de baixa renda no CadÚnico.' }]
      : [],
  },
]

/** Estados onde não encontramos programa estadual de transferência de renda ativo. */
export const ESTADOS_SEM_PROGRAMA: UF[] = ['AC', 'PA', 'RN', 'MG', 'RJ', 'RO']
