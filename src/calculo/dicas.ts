import { brl } from '../lib/formatar'
import type { Cenario, Familia, Pessoa } from './tipos'

/** Passo a passo em linguagem simples para a família conseguir os benefícios do melhor cenário. */
export function gerarDicas(f: Familia, melhor: Cenario, todos: Cenario[], candidatosBPC: Pessoa[]): string[] {
  const d: string[] = []
  if (f.cadUnico !== 'sim') {
    d.push('Primeiro passo: faça ou atualize o Cadastro Único (CadÚnico) no CRAS da sua cidade. Quase todos os benefícios dependem dele.')
  }
  const naoPedidos = candidatosBPC.filter((p) => !melhor.bpcPara.includes(p.id))
  if (naoPedidos.length > 0 && melhor.comBolsaFamilia) {
    const comTodos = todos.find((c) => c.bpcPara.length === candidatosBPC.length)
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
