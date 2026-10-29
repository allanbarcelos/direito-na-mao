const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtInteiro = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

/** Formata em reais. Valores inteiros saem sem centavos ("R$ 1.621"). */
export function brl(v: number): string {
  return (Number.isInteger(v) ? fmtInteiro : fmt).format(v).replace(/ /g, ' ')
}

/** Valores grandes por extenso curto: "R$ 158,3 bilhões". */
export function brlGrande(v: number): string {
  const n = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
  if (v >= 1e12) return `R$ ${n.format(v / 1e12)} trilhão${v >= 2e12 ? 'ões' : ''}`.replace('trilhãoões', 'trilhões')
  if (v >= 1e9) return `R$ ${n.format(v / 1e9)} bilhões`
  if (v >= 1e6) return `R$ ${n.format(v / 1e6)} milhões`
  return brl(v)
}

export function numero(v: number): string {
  return new Intl.NumberFormat('pt-BR').format(v)
}

export function dataBR(iso: string): string {
  const [a, m, d] = iso.split('-')
  return d ? `${d}/${m}/${a}` : `${m}/${a}`
}
