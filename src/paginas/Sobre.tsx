import { Fontes } from '../componentes/Fontes'
import { NOME_SITE } from '../config'
import { PROGRAMAS_ESTADUAIS } from '../data/programasEstaduais'
import { PROGRAMAS_FEDERAIS } from '../data/programasFederais'
import { DATA_ATUALIZACAO, FONTES_REFERENCIA } from '../data/referencias'
import { dataBR } from '../lib/formatar'

export function Sobre() {
  const todas = [...FONTES_REFERENCIA, ...[...PROGRAMAS_FEDERAIS, ...PROGRAMAS_ESTADUAIS].flatMap((p) => p.fontes)]
  const unicas = [...new Map(todas.map((f) => [f.url, f])).values()]
  return (
    <>
      <h1>Sobre o {NOME_SITE}</h1>
      <section className="cartao">
        <ul className="lista-simples">
          <li>É um guia gratuito e independente. <strong>Não é um site do governo</strong> e não faz cadastro em nenhum programa.</li>
          <li>Funciona sem servidor: o cálculo é feito no seu próprio aparelho e <strong>nenhuma resposta é enviada para a internet</strong>.</li>
          <li>Depois de aberto uma vez, funciona até sem internet.</li>
          <li>Valores conferidos em <strong>{dataBR(DATA_ATUALIZACAO)}</strong>. Leis e valores mudam: confirme sempre no CRAS ou no site oficial.</li>
          <li>Programas marcados “confirmar” estão em lei, mas não achamos prova de pagamento recente; eles não entram na soma da simulação.</li>
        </ul>
      </section>

      <section className="cartao">
        <h2>Como o cálculo funciona</h2>
        <ol className="lista-simples">
          <li>Somamos a renda de todos da casa (trabalho, aposentadoria, pensão e BPC) e dividimos pelo número de pessoas.</li>
          <li>Comparamos com os limites de cada programa (por exemplo, R$ 218 por pessoa no Bolsa Família; R$ 405,25 no BPC).</li>
          <li>O BPC conta como renda no Bolsa Família. Por isso o sistema testa todas as combinações de pedir ou não o BPC para cada pessoa que pode, com e sem Bolsa Família, e mostra a que dá mais dinheiro todo mês.</li>
          <li>Benefícios anuais ou de temporada são mostrados como média por mês.</li>
        </ol>
      </section>

      <section className="cartao">
        <Fontes fontes={unicas} titulo={`Todas as fontes oficiais (${unicas.length})`} />
      </section>
    </>
  )
}
