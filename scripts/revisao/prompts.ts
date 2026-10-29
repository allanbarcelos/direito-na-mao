import { readFileSync } from 'node:fs'
import { NOMES_UF, type UF } from '../../src/servicos/tipos'
import type { Programa } from '../../src/dados/esquema'
import { DOMINIOS_OFICIAIS } from './validacao'

const ESQUEMA = readFileSync(new URL('../../src/dados/esquema.ts', import.meta.url), 'utf8')
const LOCAIS = readFileSync(new URL('../../src/dados/locais.json', import.meta.url), 'utf8')

/** Instruções fixas (vão em cache entre as chamadas). */
export const SISTEMA = `Você mantém o catálogo de um site público e gratuito que explica a brasileiros de baixa renda quais programas de transferência de renda do governo (federal e estaduais) eles podem receber, quanto e como pedir. Muitos leitores têm pouca escolaridade e pouca familiaridade com tecnologia; o simulador do site usa os dados que você revisa para calcular quanto cada família recebe. Um valor errado pode fazer alguém deixar de pedir um benefício ou contar com dinheiro que não vem.

Como trabalhar:
- Pesquise apenas em fontes oficiais: leis, decretos e portarias (Planalto, Diário Oficial, assembleias), páginas .gov.br de ministérios, do Portal da Transparência e dos governos estaduais. A pesquisa já está limitada a ${DOMINIOS_OFICIAIS.join(', ')}.
- Só altere um dado quando uma fonte oficial confirmar o valor novo, e registre a URL dessa fonte na mudança. Notícias, blogs e sites de terceiros não servem como prova.
- Se não encontrar confirmação oficial de que um programa continua pagando, diga isso (situação "sem_confirmacao") em vez de supor. Não invente valores, datas, números de lei ou URLs.
- Prefira a fonte mais recente. Ao citar, preencha "data" (AAAA-MM-DD) quando a página trouxer a data.
- Textos para o público ("resumo", "paraQuem", "regras", "comoPedir", "valorTexto", "motivo", "avisos") devem ser em português simples, frases curtas, sem siglas soltas e com valores em reais.
- O campo "calculo" descreve como o simulador calcula o benefício, numa linguagem declarativa definida no esquema abaixo. Mantenha-o coerente com as regras oficiais. Se a regra real não couber nessa linguagem, deixe "calculo" de fora e explique em "observacao".
- "icone" é o nome de um ícone do Bootstrap Icons sem o prefixo "bi-" (ex.: "cash-stack", "basket2-fill", "people-fill").
- "onde" usa os ids dos locais cadastrados (lista abaixo).
- Responda sempre chamando a ferramenta indicada no pedido, com o JSON completo.

Esquema dos dados (TypeScript + zod):
\`\`\`ts
${ESQUEMA}
\`\`\`

Locais cadastrados (para o campo "onde"):
\`\`\`json
${LOCAIS}
\`\`\``

export function pedidoRevisao(p: Programa, hoje: string): string {
  return `Data de hoje: ${hoje}.

Revise o programa abaixo. Verifique nas fontes oficiais:
1. Se ele ainda existe e está pagando.
2. Se valores, limites de renda, público e regras continuam os mesmos (inclusive o "calculo").
3. Se as fontes continuam válidas; troque links quebrados por páginas oficiais equivalentes.

Devolva com a ferramenta "registrar_revisao" o programa completo, já corrigido, e a lista de mudanças com a fonte de cada uma. Se nada mudou, use a situação "sem_mudanca" e devolva o programa igual.

\`\`\`json
${JSON.stringify(p, null, 2)}
\`\`\``
}

export function pedidoNovos(alvo: 'federal' | UF, existentes: Programa[], hoje: string): string {
  const onde = alvo === 'federal' ? 'do governo federal' : `do governo do estado de ${NOMES_UF[alvo]} (${alvo})`
  const lista = existentes.map((p) => `- ${p.id}: ${p.nome}`).join('\n') || '(nenhum)'
  return `Data de hoje: ${hoje}.

Procure programas de transferência de renda ${onde} que estejam ativos hoje e ainda não estejam no catálogo. Contam programas que pagam dinheiro direto ao cidadão ou à família (inclusive bolsas para estudantes de baixa renda), ou entregam um benefício concreto como botijão de gás ou desconto em conta. Não contam programas só de serviços, crédito, obras ou repasses a prefeituras.

Já cadastrados ${alvo === 'federal' ? '(federais)' : `(${alvo})`}:
${lista}

Para cada programa novo confirmado em fonte oficial, monte a ficha completa no formato do esquema${alvo === 'federal' ? ' (esfera "federal", sem "uf")' : ` (esfera "estadual", uf "${alvo}", id começando com "${alvo.toLowerCase()}-")`}, com "conferido" igual à data de hoje. Use status "ativo" só com prova oficial de pagamento recente; caso contrário, "confirmar".

Devolva com a ferramenta "registrar_novos". Se não houver nenhum, devolva a lista vazia e explique em "observacoes" o que foi pesquisado.`
}

export function pedidoReferencias(atual: unknown, hoje: string): string {
  return `Data de hoje: ${hoje}.

Confira nas fontes oficiais os valores de referência abaixo: salário mínimo vigente, teto do INSS, valores e limites do Bolsa Família (inclusive a Regra de Proteção) e as regras do BPC. Corrija o que mudou, atualize "dataAtualizacao" para hoje e devolva com a ferramenta "registrar_referencias", listando cada mudança com a fonte.

\`\`\`json
${JSON.stringify(atual, null, 2)}
\`\`\``
}

export function pedidoGastos(atual: unknown, hoje: string): string {
  return `Data de hoje: ${hoje}.

Atualize os números de gasto abaixo com os dados oficiais mais recentes (Portal da Transparência, MDS, Secom, MEC, MTE):
- inclua em "bolsaFamiliaMensal" os meses cujo total da folha foi divulgado oficialmente e ainda não estão na lista;
- atualize os "destaques" e os "numeros" quando houver dado oficial mais novo, ajustando "periodo" e a fonte. Destaques com "calculado": true são somados pelo site; não mude o valor deles.

Devolva com a ferramenta "registrar_gastos", listando cada mudança com a fonte.

\`\`\`json
${JSON.stringify(atual, null, 2)}
\`\`\``
}
