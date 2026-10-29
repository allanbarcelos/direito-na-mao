import type { Fonte } from './tipos'

/** Data em que os valores deste site foram conferidos. */
export const DATA_ATUALIZACAO = '2026-10-29'

/** Salário mínimo nacional de 2026 (Decreto nº 12.797/2025). */
export const SALARIO_MINIMO = 1621

export const BOLSA_FAMILIA = {
  /** Renda por pessoa máxima para entrar no programa. */
  linhaEntrada: 218,
  /** Benefício de Renda de Cidadania, por pessoa. */
  rendaCidadania: 164,
  /** Valor mínimo garantido por família (Benefício Complementar). */
  minimoFamilia: 691,
  /** Benefício Primeira Infância, por criança de 0 a 6 anos. */
  primeiraInfancia: 173,
  /** Benefício Variável Familiar: gestante, nutriz e crianças/jovens de 7 a 17 anos. */
  variavelFamiliar: 58,
  /** Regra de Proteção: limite de renda por pessoa (Portaria MDS nº 1.084/2025). */
  protecaoLimite: 706,
  protecaoPercentual: 0.5,
  protecaoMeses: 12,
}

export const BPC = {
  valor: SALARIO_MINIMO,
  /** 1/4 do salário mínimo por pessoa. */
  limiteRenda: SALARIO_MINIMO / 4,
  idadeMinima: 65,
}

export const PE_DE_MEIA = {
  incentivoMatricula: 200,
  parcelaFrequencia: 200,
  parcelasPorAno: 9,
  conclusaoPorAno: 1000,
  enem: 200,
  idadeMin: 14,
  idadeMax: 24,
  limiteRenda: SALARIO_MINIMO / 2,
}

export const MEIO_SALARIO = SALARIO_MINIMO / 2

/** Fontes das constantes acima — mostradas na página "Fontes". */
export const FONTES_REFERENCIA: Fonte[] = [
  {
    titulo: 'Decreto nº 12.797/2025 — salário mínimo de R$ 1.621 em 2026',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm',
    orgao: 'Presidência da República',
  },
  {
    titulo: 'Lei nº 14.601/2023 — Programa Bolsa Família',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14601.htm',
    orgao: 'Presidência da República',
  },
  {
    titulo: 'Bolsa Família terá valor mínimo de R$ 691 a partir de outubro',
    url: 'https://www.gov.br/mds/pt-br/noticias/bolsa-familia-tera-valor-minimo-de-r-691-a-partir-de-outubro',
    orgao: 'Ministério do Desenvolvimento e Assistência Social (MDS)',
    data: '2026-09-17',
  },
  {
    titulo: 'Portaria MDS nº 1.084/2025 — atualiza a Regra de Proteção',
    url: 'https://www.gov.br/mds/pt-br/noticias-e-conteudos/desenvolvimento-social/noticias-desenvolvimento-social/portaria-atualiza-regra-de-protecao-do-bolsa-familia',
    orgao: 'MDS',
    data: '2025-05-27',
  },
  {
    titulo: 'Lei nº 8.742/1993 (LOAS) — Benefício de Prestação Continuada',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8742.htm',
    orgao: 'Presidência da República',
  },
  {
    titulo: 'Lei nº 14.818/2024 — Pé-de-Meia',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14818.htm',
    orgao: 'Presidência da República',
  },
]
