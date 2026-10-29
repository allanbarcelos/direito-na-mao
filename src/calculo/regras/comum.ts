import type { Familia, Pessoa } from '../tipos'

export const nomeDe = (p: Pessoa, i: number) => p.nome.trim() || `Pessoa ${i + 1}`

/** Renda de trabalho + aposentadoria/pensão de todos da casa (sem BPC). */
export function rendaBase(f: Familia): number {
  return f.pessoas.reduce((s, p) => s + p.rendaTrabalho + p.aposentadoria, 0)
}
