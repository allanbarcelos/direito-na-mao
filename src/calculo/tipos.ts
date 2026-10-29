import type { UF } from '../data/tipos'

export type Escola = 'nao' | 'fundamental' | 'medio' | 'faculdade'

export interface Pessoa {
  id: string
  nome: string
  idade: number
  deficiencia: boolean
  /** Deficiência causada pelo vírus Zika (síndrome congênita). */
  zika: boolean
  gestante: boolean
  amamentando: boolean
  escola: Escola
  /** Estuda em tempo integral (algumas bolsas estaduais pagam mais). */
  integral: boolean
  /** Renda de trabalho por mês (formal ou informal), em reais. */
  rendaTrabalho: number
  trabalhoFormal: boolean
  /** Aposentadoria ou pensão do INSS, por mês. */
  aposentadoria: number
  /** Já recebe BPC hoje. */
  recebeBPC: boolean
  /** Saiu do BPC para trabalhar com carteira. */
  saiuDoBPC: boolean
  pescador: boolean
  agricultor: boolean
  /** Indígena ou quilombola. */
  indigenaQuilombola: boolean
  /** Mulher responsável pela família. */
  responsavel: boolean
}

export interface Familia {
  uf: UF | ''
  pessoas: Pessoa[]
  semiarido: boolean
  reservaOuAssentamento: boolean
  recebeBolsaFamilia: boolean
  cadUnico: 'sim' | 'nao' | 'desatualizado'
}

export type Frequencia = 'mensal' | 'anual' | 'sazonal' | 'unico' | 'produto' | 'desconto'

export interface BeneficioCalculado {
  programaId: string
  nome: string
  icone: string
  /** Quanto representa por mês, em dinheiro (0 para produto/desconto). */
  valorMensal: number
  frequencia: Frequencia
  /** Texto curto com o valor (ex.: "R$ 1.621 por mês"). */
  valorTexto: string
  /** Para quem da família (nome), quando é individual. */
  pessoa?: string
  /** Por que a família tem direito. */
  motivo: string
  /** Avisos (prazo, vagas limitadas, regra incerta). */
  avisos: string[]
  /** Pago por tempo limitado. */
  temporario?: string
  esfera: 'federal' | 'estadual'
}

export interface Cenario {
  /** Ids das pessoas para quem se pede o BPC. */
  bpcPara: string[]
  comBolsaFamilia: boolean
  beneficios: BeneficioCalculado[]
  /** Soma mensal permanente (sem os temporários). */
  totalPermanente: number
  /** Soma mensal contando tudo, inclusive temporários. */
  totalComTemporarios: number
  totalAnual: number
  descricao: string
}

export interface Resultado {
  melhor: Cenario
  alternativas: Cenario[]
  /** Benefícios que existem no estado mas não puderam ser confirmados (fora da soma). */
  aConfirmar: BeneficioCalculado[]
  dicas: string[]
  rendaPorPessoa: number
  pessoas: number
}
