import type { Local } from './tipos'

export const LOCAIS: Local[] = [
  {
    id: 'cras', nome: 'CRAS', icone: 'house-heart-fill',
    oQueE: 'Centro de Referência de Assistência Social. É a "porta de entrada" da assistência social: lá você faz o Cadastro Único (CadÚnico) e pede quase todos os benefícios.',
    comoAchar: 'Pergunte na prefeitura, no posto de saúde ou ligue 121. Leve CPF ou título de eleitor de todos da casa e comprovante de endereço.',
    telefone: '121',
    link: 'https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico',
  },
  {
    id: 'inss', nome: 'INSS', icone: 'building-fill',
    oQueE: 'Instituto Nacional do Seguro Social. É onde se pede o BPC, o Auxílio-Inclusão e a pensão especial do Zika.',
    comoAchar: 'Ligue 135 (de graça, de segunda a sábado) ou use o aplicativo Meu INSS. Não precisa de intermediário.',
    telefone: '135',
    link: 'https://meu.inss.gov.br',
  },
  {
    id: 'caixa', nome: 'Caixa Econômica Federal', icone: 'bank2',
    oQueE: 'Banco que paga o Bolsa Família, o Pé-de-Meia, a Bolsa Verde e outros benefícios.',
    comoAchar: 'O dinheiro cai no aplicativo Caixa Tem. Para sacar, use lotéricas, agências ou caixas eletrônicos com o cartão.',
    telefone: '111',
    link: 'https://www.caixa.gov.br/programas-sociais',
  },
  {
    id: 'escola', nome: 'Escola', icone: 'book-fill',
    oQueE: 'A própria escola pública do estudante. O Pé-de-Meia e as bolsas estaduais de estudante são automáticos para quem está matriculado e no CadÚnico.',
    comoAchar: 'Fale com a secretaria da escola para conferir se o CPF do aluno e do responsável estão certos.',
  },
  {
    id: 'colonia', nome: 'Colônia de Pescadores / MTE', icone: 'water',
    oQueE: 'Para o Seguro-Defeso. O pescador precisa do Registro Geral da Pesca (RGP) e pede o benefício no Ministério do Trabalho.',
    comoAchar: 'Procure a colônia ou associação de pescadores da sua cidade, ou ligue 158 (Alô Trabalho).',
    telefone: '158',
    link: 'https://www.gov.br/trabalho-e-emprego',
  },
  {
    id: 'sindicato-rural', nome: 'Secretaria de Agricultura / Sindicato Rural', icone: 'flower1',
    oQueE: 'Para o Garantia-Safra. A inscrição é feita pela prefeitura, junto com a secretaria de agricultura ou o sindicato dos trabalhadores rurais.',
    comoAchar: 'Procure a secretaria de agricultura da prefeitura antes do período de plantio.',
    link: 'https://www.gov.br/mda/pt-br',
  },
  {
    id: 'icmbio', nome: 'ICMBio / INCRA', icone: 'tree-fill',
    oQueE: 'Órgãos que cuidam das reservas e dos assentamentos. Eles indicam as famílias para a Bolsa Verde.',
    comoAchar: 'Fale com a associação da reserva ou do assentamento, ou com o escritório do ICMBio/INCRA da região.',
    link: 'https://www.gov.br/mma/pt-br/composicao/snpct/dpct/bolsa-verde',
  },
  {
    id: 'distribuidora', nome: 'Companhia de energia', icone: 'lightbulb-fill',
    oQueE: 'A empresa que manda a conta de luz. A Tarifa Social costuma entrar sozinha para quem está no CadÚnico.',
    comoAchar: 'Se não aparecer o desconto na conta, ligue para o número que está na conta de luz e informe o NIS.',
  },
  {
    id: 'universidade', nome: 'Universidade', icone: 'mortarboard-fill',
    oQueE: 'Para a Bolsa Permanência e bolsas estaduais de estudantes universitários.',
    comoAchar: 'Procure a pró-reitoria de assuntos estudantis da sua universidade.',
  },
  {
    id: 'estado', nome: 'Secretaria estadual de Assistência Social', icone: 'map-fill',
    oQueE: 'Os programas do seu estado. Muitos usam os dados do CadÚnico e selecionam as famílias sozinhos.',
    comoAchar: 'Veja o site oficial do programa (link em cada programa) ou pergunte no CRAS.',
  },
]

export const LOCAL_POR_ID = Object.fromEntries(LOCAIS.map((l) => [l.id, l])) as Record<string, Local>

export const CANAIS = [
  { nome: 'Disque Social', numero: '121', para: 'Bolsa Família, CadÚnico e programas do MDS', icone: 'telephone-fill' },
  { nome: 'INSS', numero: '135', para: 'BPC, Auxílio-Inclusão, pensão Zika', icone: 'telephone-fill' },
  { nome: 'Caixa', numero: '111', para: 'Pagamentos, cartão e Caixa Tem', icone: 'telephone-fill' },
  { nome: 'Alô Trabalho', numero: '158', para: 'Seguro-Defeso, Abono, Seguro-Desemprego', icone: 'telephone-fill' },
]

export const APLICATIVOS = [
  { nome: 'Bolsa Família', para: 'Ver valor, data de pagamento e situação', url: 'https://www.gov.br/pt-br/apps/bolsa-familia' },
  { nome: 'Meu CadÚnico', para: 'Consultar e atualizar o Cadastro Único', url: 'https://www.gov.br/pt-br/apps/meu-cadunico' },
  { nome: 'Meu INSS', para: 'Pedir BPC e acompanhar pedidos', url: 'https://meu.inss.gov.br' },
  { nome: 'Caixa Tem', para: 'Receber e usar o dinheiro dos benefícios', url: 'https://www.caixa.gov.br/caixa-tem' },
]
