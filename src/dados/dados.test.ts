import { describe, expect, it } from 'vitest'
import { BancoProgramasEsquema, GastosEsquema, LocaisEsquema, ReferenciasEsquema } from './esquema'
import gastos from './gastos.json'
import locais from './locais.json'
import programas from './programas.json'
import referencias from './referencias.json'

const validar = (esquema: { safeParse: (x: unknown) => { success: boolean; error?: { issues: unknown[] } } }, dados: unknown) => {
  const r = esquema.safeParse(dados)
  return r.success ? [] : r.error!.issues
}

describe('banco de dados em JSON', () => {
  it('programas.json segue o esquema', () => {
    expect(validar(BancoProgramasEsquema, programas)).toEqual([])
  })

  it('referencias.json segue o esquema', () => {
    expect(validar(ReferenciasEsquema, referencias)).toEqual([])
  })

  it('gastos.json segue o esquema', () => {
    expect(validar(GastosEsquema, gastos)).toEqual([])
  })

  it('locais.json segue o esquema', () => {
    expect(validar(LocaisEsquema, locais)).toEqual([])
  })

  it('todo "onde" de programa aponta para um local cadastrado', () => {
    const ids = new Set(locais.locais.map((l) => l.id))
    for (const p of programas.programas) for (const o of p.onde) expect(ids, `${p.id} → ${o}`).toContain(o)
  })

  it('programa "ativo" que entra na simulação tem cálculo, exceto BF e BPC (em código)', () => {
    const semCalculo = programas.programas
      .filter((p) => p.esfera === 'estadual' && !('calculo' in p))
      .map((p) => p.id)
    expect(semCalculo).toEqual([])
  })
})
