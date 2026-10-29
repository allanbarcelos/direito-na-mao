/**
 * Formato do "banco de dados" em JSON (src/dados/*.json).
 *
 * O site importa só os tipos daqui; a validação com zod roda nos testes e no
 * script de revisão automática, então o zod não entra no bundle do site.
 */
import { z } from 'zod'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

const data = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'use AAAA-MM-DD ou AAAA-MM')

export const FonteEsquema = z.object({
  titulo: z.string().min(3),
  url: z.string().url().startsWith('https://'),
  orgao: z.string().min(2),
  data: data.optional(),
}).strict()

/** Valor em reais ou fração do salário mínimo ({ "sm": 0.5 } = meio salário). */
export const ValorEsquema = z.union([z.number().nonnegative(), z.object({ sm: z.number().positive() }).strict()])

/** Filtro de pessoa: todos os campos informados precisam bater. */
export const FiltroPessoaEsquema = z.object({
  idadeMin: z.number().int().nonnegative(),
  idadeMax: z.number().int().nonnegative(),
  escola: z.array(z.enum(['nao', 'fundamental', 'medio', 'faculdade'])).min(1),
  integral: z.boolean(),
  deficiencia: z.boolean(),
  zika: z.boolean(),
  gestante: z.boolean(),
  amamentando: z.boolean(),
  responsavel: z.boolean(),
  trabalhoFormal: z.boolean(),
  saiuDoBPC: z.boolean(),
  pescador: z.boolean(),
  agricultor: z.boolean(),
  indigenaQuilombola: z.boolean(),
  /** Não recebe BPC nem vai pedir no cenário. */
  semBPC: z.boolean(),
  semAposentadoria: z.boolean(),
  rendaTrabalhoMax: ValorEsquema,
}).partial().strict()

/** Condições sobre a família. Todas as informadas precisam ser verdadeiras. */
export const CondicaoEsquema = z.object({
  /** Renda por pessoa (trabalho + aposentadoria + BPC), sem o Bolsa Família. */
  rendaPorPessoaMax: ValorEsquema,
  /** Renda por pessoa contando o Bolsa Família recebido. */
  rendaComBolsaFamiliaMax: ValorEsquema,
  /** Renda total da família. */
  rendaFamiliarMax: ValorEsquema,
  bolsaFamilia: z.enum(['exige', 'exclui']),
  pessoasMin: z.number().int().positive(),
  /** Cada filtro precisa ser atendido por pelo menos uma pessoa da casa. */
  alguem: z.array(FiltroPessoaEsquema).min(1),
  semiarido: z.boolean(),
  reservaOuAssentamento: z.boolean(),
  /** Alguém da casa recebe ou vai pedir BPC. */
  temBPC: z.boolean(),
  /** Motivo mostrado quando esta condição (dentro de "qualquer") é a que vale. */
  motivo: z.string(),
}).partial().strict()

const Frequencia = z.enum(['mensal', 'anual', 'sazonal', 'unico', 'produto', 'desconto'])

/**
 * Como calcular o benefício. Placeholders em textos: {valor} (valor pago no período)
 * e {n} (pessoas na casa).
 */
export const CalculoEsquema = z.object({
  requisitos: CondicaoEsquema.extend({ qualquer: z.array(CondicaoEsquema).min(1).optional() }).strict().optional(),
  /** familia: um valor para a casa; porPessoa: um para cada pessoa do filtro; porPessoaDaFamilia: valor × pessoas da casa. */
  tipo: z.enum(['familia', 'porPessoa', 'porPessoaDaFamilia']),
  valor: ValorEsquema,
  /** porPessoa: valor para quem estuda em tempo integral. */
  valorIntegral: ValorEsquema.optional(),
  /** familia: soma "valor" por pessoa que bate no filtro, descontando as primeiras N. */
  adicionais: z.array(z.object({ por: FiltroPessoaEsquema, valor: ValorEsquema, descontar: z.number().int().nonnegative().optional() }).strict()).optional(),
  /** porPessoa: quem recebe. */
  pessoas: FiltroPessoaEsquema.optional(),
  maxPessoas: z.number().int().positive().optional(),
  /** Quantas vezes o valor é pago por ano (12 = todo mês). A soma usa a média mensal. */
  pagamentosPorAno: z.number().positive().max(13).optional(),
  /** Produto, desconto ou valor que não entra na soma. */
  semValor: z.boolean().optional(),
  frequencia: Frequencia.optional(),
  texto: z.string().optional(),
  textoPorTamanho: z.array(z.object({ pessoasMin: z.number().int().nonnegative(), texto: z.string() }).strict()).optional(),
  motivo: z.string().min(3),
  avisos: z.array(z.string()).optional(),
  temporario: z.string().optional(),
  nome: z.string().optional(),
}).strict()

export const ProgramaEsquema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nome: z.string().min(2),
  esfera: z.enum(['federal', 'estadual']),
  uf: z.enum(UFS).optional(),
  categoria: z.enum(['dinheiro', 'poupanca', 'produto', 'desconto', 'trabalhista']),
  /** Nome de um ícone do Bootstrap Icons, sem o prefixo "bi-". */
  icone: z.string().regex(/^[a-z0-9-]+$/),
  resumo: z.string().min(10),
  valorTexto: z.string().min(2),
  paraQuem: z.array(z.string()).min(1),
  regras: z.array(z.string()),
  comoPedir: z.array(z.string()).min(1),
  onde: z.array(z.string()),
  acumulaBolsaFamilia: z.enum(['sim', 'nao', 'incerto']),
  /** ativo: pagamento confirmado em fonte oficial; confirmar: fora da soma. */
  status: z.enum(['ativo', 'confirmar']),
  observacao: z.string().optional(),
  fontes: z.array(FonteEsquema).min(1),
  conferido: data,
  /** Sem cálculo, o programa aparece no catálogo mas não na simulação. */
  calculo: CalculoEsquema.optional(),
}).strict().refine((p) => (p.esfera === 'estadual') === (p.uf !== undefined), {
  message: 'programa estadual precisa de "uf" (e federal não pode ter)',
})

export const ReferenciasEsquema = z.object({
  dataAtualizacao: data,
  salarioMinimo: z.number().positive(),
  tetoInss: z.number().positive(),
  bolsaFamilia: z.object({
    linhaEntrada: z.number().positive(),
    rendaCidadania: z.number().positive(),
    minimoFamilia: z.number().positive(),
    primeiraInfancia: z.number().positive(),
    variavelFamiliar: z.number().positive(),
    protecaoLimite: z.number().positive(),
    protecaoPercentual: z.number().positive().max(1),
    protecaoMeses: z.number().int().positive(),
  }).strict(),
  bpc: z.object({
    idadeMinima: z.number().int().positive(),
    /** Limite de renda por pessoa, em fração do salário mínimo. */
    fracaoRenda: z.number().positive().max(1),
  }).strict(),
  fontes: z.array(FonteEsquema).min(1),
}).strict()

export const BancoProgramasEsquema = z.object({
  programas: z.array(ProgramaEsquema),
}).strict().superRefine((b, ctx) => {
  const ids = new Set<string>()
  for (const p of b.programas) {
    if (ids.has(p.id)) ctx.addIssue({ code: 'custom', message: `id repetido: ${p.id}` })
    ids.add(p.id)
  }
})

const NumeroEsquema = z.object({ rotulo: z.string(), valor: z.string(), fonte: FonteEsquema }).strict()

export const GastosEsquema = z.object({
  bolsaFamiliaMensal: z.array(z.object({
    mes: z.string().regex(/^\d{4}-\d{2}$/), familias: z.number(), total: z.number(), media: z.number(), fonte: FonteEsquema,
  }).strict()),
  destaques: z.array(z.object({
    id: z.string(), titulo: z.string(), valor: z.number(), periodo: z.string(), detalhe: z.string(),
    fonte: FonteEsquema, calculado: z.boolean().optional(),
  }).strict()).min(1),
  numeros: z.array(NumeroEsquema),
}).strict()

export const LocaisEsquema = z.object({
  locais: z.array(z.object({
    id: z.string(), nome: z.string(), icone: z.string(), oQueE: z.string(), comoAchar: z.string(),
    telefone: z.string().optional(), link: z.string().url().optional(),
  }).strict()),
  canais: z.array(z.object({ nome: z.string(), numero: z.string(), para: z.string(), icone: z.string() }).strict()),
  aplicativos: z.array(z.object({ nome: z.string(), para: z.string(), url: z.string().url() }).strict()),
}).strict()

export type Fonte = z.infer<typeof FonteEsquema>
export type Valor = z.infer<typeof ValorEsquema>
export type FiltroPessoa = z.infer<typeof FiltroPessoaEsquema>
export type Condicao = z.infer<typeof CondicaoEsquema>
export type Calculo = z.infer<typeof CalculoEsquema>
export type Programa = z.infer<typeof ProgramaEsquema>
export type Referencias = z.infer<typeof ReferenciasEsquema>
export type Gastos = z.infer<typeof GastosEsquema>
export type Locais = z.infer<typeof LocaisEsquema>
