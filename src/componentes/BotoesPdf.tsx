import { useState } from 'react'
import type { Resultado } from '../calculo/tipos'
import type { Simulacao } from '../estado/simulacao'
import { podeCompartilharArquivo } from '../lib/dispositivo'
import { montarDocumento } from '../pdf/conteudo'
import { Icone } from './Icone'

type Estado = 'pronto' | 'gerando' | 'erro'

/** Baixar ou compartilhar o PDF da simulação para levar ao CRAS. */
export function BotoesPdf({ sim, resultado }: { sim: Simulacao; resultado: Resultado }) {
  const [estado, setEstado] = useState<Estado>('pronto')
  const [podeCompartilhar] = useState(podeCompartilharArquivo)

  const gerar = async (acao: 'baixar' | 'compartilhar') => {
    setEstado('gerando')
    try {
      const pdf = await import('../pdf/gerar')
      const quando = new Date()
      const blob = await pdf.gerarPdf(montarDocumento(sim, resultado, quando))
      const nome = pdf.nomeArquivo(quando)
      if (acao === 'compartilhar') {
        try {
          await pdf.compartilhar(blob, nome)
        } catch (e) {
          // Cancelar o compartilhamento não é erro; qualquer outra falha cai para o download.
          if ((e as DOMException).name !== 'AbortError') pdf.baixar(blob, nome)
        }
      } else {
        pdf.baixar(blob, nome)
      }
      setEstado('pronto')
    } catch {
      setEstado('erro')
    }
  }

  return (
    <div className="botoes-pdf nao-imprimir">
      <button type="button" className="botao" onClick={() => gerar('baixar')} disabled={estado === 'gerando'}>
        <Icone nome="file-earmark-pdf-fill" /> {estado === 'gerando' ? 'Gerando PDF…' : 'Baixar PDF para levar ao CRAS'}
      </button>
      {podeCompartilhar && (
        <button type="button" className="botao secundario" onClick={() => gerar('compartilhar')} disabled={estado === 'gerando'}>
          <Icone nome="share-fill" /> Compartilhar PDF
        </button>
      )}
      <p className="rotulo" role="status">
        {estado === 'erro'
          ? 'Não foi possível gerar o PDF. Tente de novo ou use o botão de imprimir do navegador.'
          : 'O PDF traz o resultado, perguntas prontas para o atendimento e as leis usadas no cálculo. Ele não é um documento oficial.'}
      </p>
    </div>
  )
}
