import { describe, expect, it } from 'vitest'
import ICONES from 'bootstrap-icons/font/bootstrap-icons.json'
import { PROGRAMAS, programaPorId } from '../../servicos/catalogo'
import { LOCAIS } from '../../servicos/locais'
import { PROGRAMAS_ESTADUAIS } from '../../servicos/catalogo'
import { UFS } from '../../servicos/tipos'
import type { Contexto, Regra } from '../tipos'
import { aplicarRegras } from './aplicar'
import { REGRA_BPC } from './bpc'
import { regrasDoEstado } from './estaduais'
import { REGRAS_FEDERAIS } from './federais'

const ctxVazio: Contexto = {
  familia: { uf: '', pessoas: [], semiarido: false, reservaOuAssentamento: false, recebeBolsaFamilia: false, cadUnico: 'sim' },
  n: 1, rendaFamiliar: 0, rendaPorPessoa: 0, bolsaFamilia: 0, recebeBolsaFamilia: false, bpcPara: new Set(),
}

describe('catálogo', () => {
  it('não tem ids repetidos', () => {
    const ids = PROGRAMAS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todo programa tem pelo menos uma fonte oficial com https', () => {
    for (const p of PROGRAMAS) {
      expect(p.fontes.length, p.id).toBeGreaterThan(0)
      for (const f of p.fontes) expect(f.url, p.id).toMatch(/^https:\/\//)
    }
  })

  it('toda regra registrada aponta para um programa do catálogo', () => {
    const regras = [REGRA_BPC, ...REGRAS_FEDERAIS, ...UFS.flatMap((uf) => regrasDoEstado(uf))]
    for (const r of regras) expect(programaPorId(r.programaId), r.programaId).toBeDefined()
    expect(programaPorId('bolsa-familia')).toBeDefined()
  })

  it('todo ícone usado nos dados existe no Bootstrap Icons', () => {
    const usados = [...PROGRAMAS.map((p) => p.icone), ...LOCAIS.map((l) => l.icone)]
    for (const nome of usados) expect(ICONES, nome).toHaveProperty(nome)
  })

  it('todo programa estadual vira regra do seu estado', () => {
    const total = UFS.reduce((s, uf) => s + regrasDoEstado(uf).length, 0)
    expect(total).toBe(PROGRAMAS_ESTADUAIS.length)
  })
})

describe('aplicarRegras', () => {
  it('aceita uma regra nova sem mudar o motor (nome e ícone vêm do catálogo)', () => {
    const nova: Regra = {
      programaId: 'bolsa-atleta',
      avaliar: () => [{ valorMensal: 410, valorTexto: 'R$ 410 por mês', motivo: 'teste' }],
    }
    const [b] = aplicarRegras([nova], ctxVazio)
    expect(b.beneficio.nome).toBe('Bolsa Atleta')
    expect(b.beneficio.icone).toBe(programaPorId('bolsa-atleta')?.icone)
    expect(b.status).toBe('ativo')
  })

  it('falha alto se a regra apontar para programa inexistente', () => {
    const errada: Regra = { programaId: 'nao-existe', avaliar: () => [{ valorMensal: 1, valorTexto: '', motivo: '' }] }
    expect(() => aplicarRegras([errada], ctxVazio)).toThrow(/catálogo/)
  })
})
