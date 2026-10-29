import {
  BOLSA_FAMILIA, BPC, MEIO_SALARIO, PE_DE_MEIA, SALARIO_MINIMO,
} from '../data/referencias'
import { brl } from '../lib/formatar'
import { avaliarEstaduais } from './estaduais'
import type {
  BeneficioCalculado, Cenario, Familia, Pessoa, Resultado,
} from './tipos'

/** Duração média do defeso usada para estimar a média mensal (varia de 3 a 5 meses). */
const MESES_DEFESO_ESTIMADOS = 4
const MAX_CANDIDATOS_BPC = 6

export interface Contexto {
  familia: Familia
  n: number
  /** Renda da família que conta para o Bolsa Família (trabalho + aposentadoria + BPC). */
  rendaFamiliar: number
  rendaPorPessoa: number
  /** Valor do Bolsa Família neste cenário (0 se não recebe). */
  bolsaFamilia: number
  recebeBolsaFamilia: boolean
  bpcPara: Set<string>
}

const nomeDe = (p: Pessoa, i: number) => p.nome.trim() || `Pessoa ${i + 1}`

export function rendaBase(f: Familia): number {
  return f.pessoas.reduce((s, p) => s + p.rendaTrabalho + p.aposentadoria, 0)
}

/** Pode pedir BPC: 65+ ou deficiência, sem aposentadoria/pensão e sem já receber. */
export function podePedirBPC(p: Pessoa): boolean {
  return (p.idade >= BPC.idadeMinima || p.deficiencia) && p.aposentadoria === 0 && !p.recebeBPC
}

/**
 * Teste de renda do BPC (1/4 do salário mínimo por pessoa).
 * Pela LOAS (art. 20 §14), BPC ou aposentadoria de até 1 salário mínimo de outro
 * idoso ou pessoa com deficiência da família não entra na conta.
 */
export function passaRendaBPC(f: Familia, candidato: Pessoa): boolean {
  let renda = 0
  for (const p of f.pessoas) {
    renda += p.rendaTrabalho
    if (p.id === candidato.id) continue
    const protegido = (p.idade >= BPC.idadeMinima || p.deficiencia) && p.aposentadoria <= SALARIO_MINIMO
    if (!protegido) renda += p.aposentadoria
  }
  return renda / f.pessoas.length <= BPC.limiteRenda
}

/** Valor cheio do Bolsa Família para a composição da família. */
export function valorBolsaFamilia(pessoas: Pessoa[]): {
  total: number; cidadania: number; complemento: number; primeiraInfancia: number; variavel: number
} {
  const cidadania = pessoas.length * BOLSA_FAMILIA.rendaCidadania
  const complemento = Math.max(0, BOLSA_FAMILIA.minimoFamilia - cidadania)
  const criancas = pessoas.filter((p) => p.idade < 7).length
  const variaveis = pessoas.filter(
    (p) => p.gestante || p.amamentando || (p.idade >= 7 && p.idade < 18),
  ).length
  const primeiraInfancia = criancas * BOLSA_FAMILIA.primeiraInfancia
  const variavel = variaveis * BOLSA_FAMILIA.variavelFamiliar
  return {
    total: cidadania + complemento + primeiraInfancia + variavel,
    cidadania, complemento, primeiraInfancia, variavel,
  }
}

function montarCenario(f: Familia, bpcPara: string[], tentarBolsaFamilia: boolean): Cenario {
  const n = f.pessoas.length
  const bpcSet = new Set(bpcPara)
  const jaBPC = f.pessoas.filter((p) => p.recebeBPC).length
  const totalBPC = (jaBPC + bpcPara.length) * BPC.valor
  const rendaFamiliar = rendaBase(f) + totalBPC
  const rendaPorPessoa = rendaFamiliar / n
  const b: BeneficioCalculado[] = []

  // BPC
  f.pessoas.forEach((p, i) => {
    if (!p.recebeBPC && !bpcSet.has(p.id)) return
    b.push({
      programaId: 'bpc', nome: 'BPC (LOAS)', icone: '🧓', esfera: 'federal',
      valorMensal: BPC.valor, frequencia: 'mensal',
      valorTexto: `${brl(BPC.valor)} por mês`,
      pessoa: nomeDe(p, i),
      motivo: p.idade >= BPC.idadeMinima ? 'Tem 65 anos ou mais e renda baixa.' : 'Tem deficiência e renda baixa.',
      avisos: p.recebeBPC ? ['Já recebe — mantenha o CadÚnico atualizado a cada 2 anos.'] : [
        'Precisa passar por avaliação no INSS (e perícia, no caso de deficiência).',
        'Não pode ser somado com aposentadoria ou pensão.',
      ],
    })
  })

  // Bolsa Família
  let bolsaFamilia = 0
  let recebeBF = false
  if (tentarBolsaFamilia) {
    const v = valorBolsaFamilia(f.pessoas)
    const partes = [
      `${n} × ${brl(BOLSA_FAMILIA.rendaCidadania)} por pessoa`,
      v.complemento > 0 ? `complemento de ${brl(v.complemento)} até o mínimo de ${brl(BOLSA_FAMILIA.minimoFamilia)}` : '',
      v.primeiraInfancia > 0 ? `${brl(v.primeiraInfancia)} pelas crianças de 0 a 6 anos` : '',
      v.variavel > 0 ? `${brl(v.variavel)} por gestantes, quem amamenta e jovens de 7 a 17` : '',
    ].filter(Boolean)
    const unipessoal = n === 1 ? ['Famílias de uma pessoa só passam por análise extra antes de entrar.'] : []
    if (rendaPorPessoa <= BOLSA_FAMILIA.linhaEntrada) {
      bolsaFamilia = v.total
      recebeBF = true
      b.push({
        programaId: 'bolsa-familia', nome: 'Bolsa Família', icone: '👨‍👩‍👧', esfera: 'federal',
        valorMensal: v.total, frequencia: 'mensal', valorTexto: `${brl(v.total)} por mês`,
        motivo: `Renda de ${brl(rendaPorPessoa)} por pessoa (limite ${brl(BOLSA_FAMILIA.linhaEntrada)}). Conta: ${partes.join(' + ')}.`,
        avisos: [
          'Precisa manter vacinas, pré-natal e frequência escolar das crianças em dia.',
          ...unipessoal,
        ],
      })
    } else if (f.recebeBolsaFamilia && rendaPorPessoa <= BOLSA_FAMILIA.protecaoLimite) {
      bolsaFamilia = Math.round(v.total * BOLSA_FAMILIA.protecaoPercentual * 100) / 100
      recebeBF = true
      b.push({
        programaId: 'bolsa-familia', nome: 'Bolsa Família (Regra de Proteção)', icone: '👨‍👩‍👧', esfera: 'federal',
        valorMensal: bolsaFamilia, frequencia: 'mensal', valorTexto: `${brl(bolsaFamilia)} por mês`,
        motivo: `A renda subiu para ${brl(rendaPorPessoa)} por pessoa, mas como a família já recebe, continua com metade do valor.`,
        avisos: ['Se a renda nova for aposentadoria, pensão ou BPC de idoso, a proteção pode durar só 2 meses.'],
        temporario: `até ${BOLSA_FAMILIA.protecaoMeses} meses`,
      })
    }
  }

  // Pé-de-Meia
  if (rendaPorPessoa <= PE_DE_MEIA.limiteRenda && n > 1) {
    const anual = PE_DE_MEIA.incentivoMatricula + PE_DE_MEIA.parcelaFrequencia * PE_DE_MEIA.parcelasPorAno + PE_DE_MEIA.conclusaoPorAno
    f.pessoas.forEach((p, i) => {
      if (p.escola !== 'medio' || p.idade < PE_DE_MEIA.idadeMin || p.idade > PE_DE_MEIA.idadeMax) return
      b.push({
        programaId: 'pe-de-meia', nome: 'Pé-de-Meia', icone: '🎒', esfera: 'federal',
        valorMensal: anual / 12, frequencia: 'anual',
        valorTexto: `até ${brl(anual)} por ano`,
        pessoa: nomeDe(p, i),
        motivo: 'Estuda no ensino médio público e a família está no CadÚnico com renda de até meio salário mínimo por pessoa.',
        avisos: [
          `${brl(PE_DE_MEIA.conclusaoPorAno)} por ano fica guardado e só pode ser sacado ao terminar o ensino médio.`,
          'Precisa de 80% de presença nas aulas. No 3º ano, mais R$ 200 por fazer o ENEM.',
        ],
      })
    })
  }

  const ate = (limite: number) => rendaPorPessoa <= limite

  // Gás do Povo (produto)
  if (ate(MEIO_SALARIO) && n >= 2) {
    const botijoes = n >= 4 ? 6 : 4
    b.push({
      programaId: 'gas-do-povo', nome: 'Gás do Povo', icone: '🔥', esfera: 'federal',
      valorMensal: 0, frequencia: 'produto', valorTexto: `${botijoes} botijões grátis por ano`,
      motivo: 'Família no CadÚnico com renda de até meio salário mínimo por pessoa.',
      avisos: ['Não é dinheiro: a família retira o botijão de 13 kg de graça em revendas credenciadas.'],
    })
  }

  // Tarifa Social de Energia (desconto)
  if (ate(MEIO_SALARIO) || totalBPC > 0) {
    b.push({
      programaId: 'tarifa-social', nome: 'Tarifa Social de Energia', icone: '💡', esfera: 'federal',
      valorMensal: 0, frequencia: 'desconto', valorTexto: 'Luz grátis até 80 kWh por mês',
      motivo: totalBPC > 0 ? 'Família com pessoa que recebe BPC.' : 'Família no CadÚnico com renda de até meio salário mínimo por pessoa.',
      avisos: ['Costuma entrar automático. Se não aparecer na conta de luz, ligue para a distribuidora com o NIS em mãos.'],
    })
  }

  // Bolsa Verde
  if (f.reservaOuAssentamento && ate(MEIO_SALARIO)) {
    b.push({
      programaId: 'bolsa-verde', nome: 'Bolsa Verde', icone: '🌳', esfera: 'federal',
      valorMensal: 200, frequencia: 'mensal', valorTexto: 'R$ 600 a cada 3 meses',
      motivo: 'Mora em reserva extrativista, floresta nacional, assentamento ou área parecida e tem renda baixa.',
      avisos: ['A família precisa ser indicada pelo ICMBio, INCRA ou órgão que cuida da área.'],
    })
  }

  // Garantia-Safra
  if (f.semiarido && f.pessoas.some((p) => p.agricultor) && rendaFamiliar <= 1.5 * SALARIO_MINIMO) {
    b.push({
      programaId: 'garantia-safra', nome: 'Garantia-Safra', icone: '🌽', esfera: 'federal',
      valorMensal: 1200 / 12, frequencia: 'anual', valorTexto: 'R$ 1.200 se perder a safra',
      motivo: 'Agricultor familiar no semiárido com renda da família de até 1,5 salário mínimo.',
      avisos: ['Só paga se a cidade tiver perda de pelo menos 50% da safra.', 'É preciso aderir antes de plantar (contribuição de cerca de R$ 24).'],
    })
  }

  // Seguro-Defeso (por pescador)
  f.pessoas.forEach((p, i) => {
    if (!p.pescador || p.recebeBPC || bpcSet.has(p.id) || p.aposentadoria > 0) return
    b.push({
      programaId: 'seguro-defeso', nome: 'Seguro-Defeso', icone: '🎣', esfera: 'federal',
      valorMensal: (SALARIO_MINIMO * MESES_DEFESO_ESTIMADOS) / 12, frequencia: 'sazonal',
      valorTexto: `${brl(SALARIO_MINIMO)} por mês de defeso`,
      pessoa: nomeDe(p, i),
      motivo: 'Pescador artesanal: recebe nos meses em que a pesca é proibida.',
      avisos: [`A média mensal considera ${MESES_DEFESO_ESTIMADOS} meses de defeso por ano; varia conforme a espécie e a região.`, 'Precisa do Registro Geral da Pesca (RGP), CadÚnico e biometria.'],
    })
  })

  // Auxílio-Inclusão
  f.pessoas.forEach((p, i) => {
    if (!p.deficiencia || !p.saiuDoBPC || !p.trabalhoFormal || p.rendaTrabalho > 2 * SALARIO_MINIMO) return
    b.push({
      programaId: 'auxilio-inclusao', nome: 'Auxílio-Inclusão', icone: '♿', esfera: 'federal',
      valorMensal: BPC.valor / 2, frequencia: 'mensal', valorTexto: `${brl(BPC.valor / 2)} por mês`,
      pessoa: nomeDe(p, i),
      motivo: 'Pessoa com deficiência que deixou o BPC para trabalhar com carteira ganhando até 2 salários mínimos.',
      avisos: ['Peça pelo Meu INSS ou pelo telefone 135.'],
    })
  })

  // Pensão especial Zika
  f.pessoas.forEach((p, i) => {
    if (!p.zika) return
    b.push({
      programaId: 'pensao-zika', nome: 'Pensão especial (Zika)', icone: '🩺', esfera: 'federal',
      valorMensal: 0, frequencia: 'mensal', valorTexto: 'Valor igual ao teto do INSS, por mês, para sempre',
      pessoa: nomeDe(p, i),
      motivo: 'Deficiência causada pela síndrome congênita do vírus Zika.',
      avisos: ['Também há indenização única de R$ 50.000.', 'Pode ser somada ao BPC.', 'O valor não entra na soma abaixo porque depende do teto do INSS do ano.'],
    })
  })

  // Bolsa Permanência
  f.pessoas.forEach((p, i) => {
    if (p.escola !== 'faculdade' || !p.indigenaQuilombola) return
    b.push({
      programaId: 'bolsa-permanencia', nome: 'Bolsa Permanência', icone: '🎓', esfera: 'federal',
      valorMensal: 1400, frequencia: 'mensal', valorTexto: 'R$ 1.400 por mês',
      pessoa: nomeDe(p, i),
      motivo: 'Estudante indígena ou quilombola em universidade federal.',
      avisos: ['Pedido feito na própria universidade.'],
    })
  })

  const ctx: Contexto = {
    familia: f, n, rendaFamiliar, rendaPorPessoa,
    bolsaFamilia, recebeBolsaFamilia: recebeBF, bpcPara: bpcSet,
  }
  b.push(...avaliarEstaduais(ctx).filter((e) => e.status === 'ativo').map((e) => e.beneficio))

  const permanente = b.filter((x) => !x.temporario).reduce((s, x) => s + x.valorMensal, 0)
  const total = b.reduce((s, x) => s + x.valorMensal, 0)
  const nomes = bpcPara.map((id) => {
    const i = f.pessoas.findIndex((p) => p.id === id)
    return nomeDe(f.pessoas[i], i)
  })
  return {
    bpcPara, comBolsaFamilia: recebeBF, beneficios: b,
    totalPermanente: arred(permanente), totalComTemporarios: arred(total), totalAnual: arred(total * 12),
    descricao: [
      nomes.length ? `Pedir BPC para ${nomes.join(', ')}` : 'Sem pedir BPC novo',
      recebeBF ? 'com Bolsa Família' : 'sem Bolsa Família',
    ].join(', '),
  }
}

const arred = (v: number) => Math.round(v * 100) / 100

function subconjuntos<T>(lista: T[]): T[][] {
  return lista.reduce<T[][]>((acc, item) => acc.concat(acc.map((s) => [...s, item])), [[]])
}

/**
 * Testa todas as combinações (pedir BPC para quem pode × com/sem Bolsa Família)
 * e devolve a que dá mais dinheiro todo mês de forma permanente.
 */
export function simular(f: Familia): Resultado {
  if (f.pessoas.length === 0) throw new Error('Família sem pessoas')
  const candidatos = f.pessoas.filter((p) => podePedirBPC(p) && passaRendaBPC(f, p)).slice(0, MAX_CANDIDATOS_BPC)
  const cenarios: Cenario[] = []
  for (const sub of subconjuntos(candidatos.map((p) => p.id))) {
    cenarios.push(montarCenario(f, sub, true))
    cenarios.push(montarCenario(f, sub, false))
  }
  cenarios.sort((a, b) => b.totalPermanente - a.totalPermanente || b.totalComTemporarios - a.totalComTemporarios)
  const vistos = new Set<string>()
  const unicos = cenarios.filter((c) => {
    const k = c.beneficios.map((x) => `${x.programaId}:${x.pessoa ?? ''}:${x.valorMensal}`).sort().join('|')
    if (vistos.has(k)) return false
    vistos.add(k)
    return true
  })
  const melhor = unicos[0]

  const base = rendaBase(f) + f.pessoas.filter((p) => p.recebeBPC).length * BPC.valor
  const ctxConfirmar: Contexto = {
    familia: f, n: f.pessoas.length, rendaFamiliar: base, rendaPorPessoa: base / f.pessoas.length,
    bolsaFamilia: 0, recebeBolsaFamilia: melhor.comBolsaFamilia, bpcPara: new Set(melhor.bpcPara),
  }
  const aConfirmar = avaliarEstaduais(ctxConfirmar).filter((e) => e.status === 'confirmar').map((e) => e.beneficio)

  return {
    melhor,
    alternativas: unicos.slice(1, 4),
    aConfirmar,
    dicas: gerarDicas(f, melhor, unicos, candidatos),
    rendaPorPessoa: arred(base / f.pessoas.length),
    pessoas: f.pessoas.length,
  }
}

function gerarDicas(f: Familia, melhor: Cenario, todos: Cenario[], candidatos: Pessoa[]): string[] {
  const d: string[] = []
  if (f.cadUnico !== 'sim') {
    d.push('Primeiro passo: faça ou atualize o Cadastro Único (CadÚnico) no CRAS da sua cidade. Quase todos os benefícios dependem dele.')
  }
  const naoPedidos = candidatos.filter((p) => !melhor.bpcPara.includes(p.id))
  if (naoPedidos.length > 0 && melhor.comBolsaFamilia) {
    const comTodos = todos.find((c) => c.bpcPara.length === candidatos.length)
    if (comTodos) {
      d.push(
        `Pedir BPC para mais pessoas faria a renda passar do limite do Bolsa Família. ` +
        `A melhor combinação é: ${melhor.descricao.toLowerCase()} (${brl(melhor.totalPermanente)} por mês) ` +
        `contra ${brl(comTodos.totalPermanente)} pedindo para todos.`,
      )
    }
  }
  if (melhor.bpcPara.length > 0) {
    d.push('O BPC é pedido no INSS (telefone 135 ou aplicativo Meu INSS). Leve documentos e laudos médicos, se for por deficiência.')
  }
  if (melhor.beneficios.some((b) => b.programaId === 'pe-de-meia')) {
    d.push('Pé-de-Meia: o estudante precisa ir às aulas (80% de presença) e passar de ano para receber os R$ 1.000 guardados.')
  }
  if (f.pessoas.some((p) => p.pescador)) {
    d.push('Pescador: mantenha o Registro Geral da Pesca (RGP) em dia e peça o Seguro-Defeso no início de cada período de defeso.')
  }
  if (!melhor.comBolsaFamilia && todos.some((c) => c.comBolsaFamilia)) {
    d.push('Nesta família, os programas do estado que não aceitam Bolsa Família rendem mais. Compare as opções abaixo com a assistente social do CRAS.')
  }
  d.push('Mantenha o CadÚnico sempre atualizado (no máximo a cada 2 anos ou quando mudar algo na família) para não perder os benefícios.')
  return d
}
