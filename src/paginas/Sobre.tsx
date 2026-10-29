import { Icone } from '../componentes/Icone'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Fontes } from '../componentes/Fontes'
import { NOME_SITE } from '../config'
import { PROGRAMAS } from '../data/catalogo'
import { DATA_ATUALIZACAO, FONTES_REFERENCIA } from '../data/referencias'
import { dataBR } from '../lib/formatar'

/** Rola até a lista de fontes e leva o foco para ela (leitores de tela). */
function irParaFontes() {
  const el = document.getElementById('fontes')
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el?.focus({ preventScroll: true })
}

export function Sobre() {
  const { pathname } = useLocation()

  // Em /fontes, vai direto para a lista (depois do Layout voltar ao topo).
  useEffect(() => {
    if (pathname !== '/fontes') return
    const t = window.setTimeout(irParaFontes, 50)
    return () => window.clearTimeout(t)
  }, [pathname])

  const todas = [...FONTES_REFERENCIA, ...PROGRAMAS.flatMap((p) => p.fontes)]
  const unicas = [...new Map(todas.map((f) => [f.url, f])).values()]
  return (
    <>
      <h1>Sobre o {NOME_SITE}</h1>
      <section className="cartao aviso">
        <h2><Icone nome="info-circle-fill" /> Este site não é do governo</h2>
        <p>
          O {NOME_SITE} é um guia <strong>independente e gratuito</strong>. Não tem ligação com o governo federal,
          com os estados ou com as prefeituras. Ele não faz cadastro, não libera benefício e não pede senha.
        </p>
        <p>
          <strong>Todas as informações vêm de fontes oficiais:</strong> leis e decretos publicados no Diário Oficial
          e no site do Planalto, páginas .gov.br dos ministérios e páginas oficiais dos governos estaduais.
          Os valores e as regras foram conferidos em <strong>{dataBR(DATA_ATUALIZACAO)}</strong>, e cada programa
          traz o link da sua fonte. <a href="#fontes" onClick={(e) => { e.preventDefault(); irParaFontes() }}>Veja todas as fontes abaixo</a>.
        </p>
        <p>
          Quando o governo muda uma regra ou um valor, o site precisa ser atualizado. Por isso,
          <strong> antes de pedir um benefício, confirme no CRAS, pelo telefone 121 ou no site oficial do programa</strong>.
          Programas marcados “confirmar” estão em lei, mas não encontramos prova de pagamento recente; eles não entram na soma da simulação.
        </p>
      </section>

      <section className="cartao">
        <h2><Icone nome="lock-fill" /> Sua privacidade</h2>
        <ul className="lista-simples">
          <li>O cálculo é feito no seu próprio aparelho. <strong>Nenhuma resposta é enviada para a internet.</strong></li>
          <li>Depois de aberto uma vez, o site funciona até sem internet.</li>
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

      <section className="cartao" id="fontes" tabIndex={-1}>
        <Fontes fontes={unicas} titulo={`Todas as fontes oficiais (${unicas.length})`} />
      </section>
    </>
  )
}
