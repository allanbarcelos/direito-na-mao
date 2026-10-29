/**
 * Desenha o PDF com o jsPDF. A biblioteca é carregada só quando a pessoa pede o PDF,
 * para não pesar na abertura do site (e fica no cache para funcionar sem internet).
 */
import type { jsPDF } from 'jspdf'
import { NOME_SITE, SITE_URL } from '../config'
import type { Bloco } from './conteudo'

const MARGEM = 18
const LARGURA = 210 - 2 * MARGEM
const LIMITE_Y = 297 - 22
const VERDE: [number, number, number] = [11, 107, 58]

/**
 * As fontes padrão do PDF só têm caracteres do português ocidental (WinAnsi).
 * Troca o que não existe nelas por equivalentes simples, para não sair lixo no papel.
 */
export function limparTexto(s: string): string {
  return s
    .replace(/[→⇒]/g, '->')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/[  ]/g, ' ')
    .replace(/[^\x20-\x7e¡-ÿ–—‘’“”•…€]/g, '')
}

export async function gerarPdf(blocos: Bloco[]): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setProperties({ title: 'Simulação de benefícios sociais (não oficial)', creator: NOME_SITE })
  let y = MARGEM

  const espaco = (altura: number) => {
    if (y + altura > LIMITE_Y) {
      doc.addPage()
      y = MARGEM
    }
  }

  const escrever = (texto: string, o: { tamanho?: number; negrito?: boolean; recuo?: number; cor?: [number, number, number] } = {}) => {
    const tamanho = o.tamanho ?? 10.5
    const recuo = o.recuo ?? 0
    doc.setFont('helvetica', o.negrito ? 'bold' : 'normal')
    doc.setFontSize(tamanho)
    doc.setTextColor(...(o.cor ?? [26, 29, 26]))
    const linhas = doc.splitTextToSize(limparTexto(texto), LARGURA - recuo) as string[]
    const altura = tamanho * 0.45
    for (const l of linhas) {
      espaco(altura)
      doc.text(l, MARGEM + recuo, y)
      y += altura
    }
  }

  /** URL clicável, quebrada em linhas se for longa. */
  const link = (url: string) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(20, 80, 163)
    for (const parte of url.match(/.{1,95}/g) ?? [url]) {
      espaco(4)
      doc.textWithLink(parte, MARGEM + 6, y, { url })
      y += 3.8
    }
  }

  for (const b of blocos) {
    switch (b.tipo) {
      case 'titulo':
        escrever(b.texto, { tamanho: 17, negrito: true, cor: VERDE })
        y += 3
        break
      case 'aviso': {
        desenharAviso(doc, b.titulo, b.texto, y)
        y += alturaAviso(doc, b.texto) + 5
        break
      }
      case 'secao':
        y += 3
        espaco(14)
        escrever(b.texto, { tamanho: 13.5, negrito: true, cor: VERDE })
        doc.setDrawColor(...VERDE)
        doc.setLineWidth(0.4)
        doc.line(MARGEM, y - 2.5, MARGEM + LARGURA, y - 2.5)
        // A próxima linha de texto começa abaixo do traço, mesmo se for um destaque em letra grande.
        y += 4
        break
      case 'paragrafo':
        escrever(b.texto, { negrito: b.negrito })
        y += 2
        break
      case 'destaque':
        escrever(b.texto, { tamanho: 14, negrito: true, cor: VERDE })
        escrever(b.detalhe)
        y += 3
        break
      case 'lista':
        b.itens.forEach((item, i) => {
          espaco(6)
          const marca = b.numerada ? `${i + 1}.` : '•'
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10.5)
          doc.setTextColor(26, 29, 26)
          doc.text(marca, MARGEM, y)
          escrever(item, { recuo: 7 })
          y += 1.2
        })
        y += 1.5
        break
      case 'beneficio':
        espaco(16)
        escrever(b.titulo, { negrito: true, tamanho: 11.5 })
        escrever(b.valor, { negrito: true, cor: VERDE })
        for (const l of b.linhas) escrever(l, { recuo: 4, tamanho: 9.5 })
        y += 3
        break
      case 'fontes':
        espaco(10)
        escrever(b.programa, { negrito: true })
        for (const f of b.fontes) {
          escrever(`• ${f.titulo} — ${f.orgao}${f.data ? ` (${f.data.split('-').reverse().join('/')})` : ''}`, { recuo: 3, tamanho: 9.5 })
          link(f.url)
        }
        y += 2
        break
    }
  }

  rodape(doc)
  return doc.output('blob')
}

function alturaAviso(doc: jsPDF, texto: string): number {
  doc.setFontSize(10)
  const linhas = doc.splitTextToSize(limparTexto(texto), LARGURA - 10) as string[]
  return 14 + linhas.length * 4.6
}

function desenharAviso(doc: jsPDF, titulo: string, texto: string, y: number) {
  const altura = alturaAviso(doc, texto)
  doc.setFillColor(255, 246, 204)
  doc.setDrawColor(200, 150, 0)
  doc.setLineWidth(0.8)
  doc.roundedRect(MARGEM, y, LARGURA, altura, 2, 2, 'FD')
  doc.setTextColor(120, 60, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(limparTexto(titulo), MARGEM + 5, y + 7)
  doc.setTextColor(26, 29, 26)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const linhas = doc.splitTextToSize(limparTexto(texto), LARGURA - 10) as string[]
  linhas.forEach((l, i) => doc.text(l, MARGEM + 5, y + 13 + i * 4.6))
}

function rodape(doc: jsPDF) {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.2)
    doc.line(MARGEM, 297 - 16, 210 - MARGEM, 297 - 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(90, 90, 90)
    doc.text(limparTexto(`Simulação NÃO OFICIAL — ${NOME_SITE} — ${SITE_URL}`), MARGEM, 297 - 11)
    doc.text(`Página ${i} de ${total}`, 210 - MARGEM, 297 - 11, { align: 'right' })
  }
}

export function nomeArquivo(quando: Date): string {
  return `simulacao-beneficios-${quando.toISOString().slice(0, 10)}.pdf`
}

export function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function compartilhar(blob: Blob, nome: string) {
  const arquivo = new File([blob], nome, { type: 'application/pdf' })
  await navigator.share({
    files: [arquivo],
    title: 'Simulação de benefícios (não oficial)',
    text: `Simulação feita no ${NOME_SITE}. Não é um documento oficial.`,
  })
}
