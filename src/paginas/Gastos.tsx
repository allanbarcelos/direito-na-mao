import { Icone } from '../componentes/Icone'
import { Ouvir } from '../componentes/Ouvir'
import { BOLSA_FAMILIA_MENSAL, DESTAQUES, NUMEROS } from '../servicos/gastos'
import { brl, brlGrande, dataBR, numero } from '../lib/formatar'

const NOME_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const mesCurto = (iso: string) => `${NOME_MES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(2, 4)}`

export function Gastos() {
  const maior = Math.max(...BOLSA_FAMILIA_MENSAL.map((m) => m.total))
  const fala = DESTAQUES.map((d) => `${d.titulo}, ${d.periodo}: ${brlGrande(d.valor)}.`).join(' ')
  return (
    <>
      <h1><Icone nome="bar-chart-fill" /> Quanto o Brasil gasta com benefícios</h1>
      <p>Números oficiais mais recentes publicados pelo governo federal. Cada valor tem o link da fonte.</p>
      <p><Ouvir texto={fala} rotulo="Ouvir números" /></p>

      <div className="grade">
        {DESTAQUES.map((d, i) => (
          <article key={d.id} className={`cartao${i === 0 ? ' destaque' : ''}`}>
            <h2 style={{ fontSize: '1.1rem' }}>{d.titulo}</h2>
            <p className="rotulo">{d.periodo}</p>
            <p className="valor-grande" style={i === 0 ? undefined : { fontSize: '2rem' }}>{brlGrande(d.valor)}</p>
            <p>{d.detalhe}</p>
            {d.calculado && <p className="rotulo">Soma feita por este site a partir dos valores oficiais de cada mês.</p>}
            <p className="fontes">
              Fonte: <a href={d.fonte.url} target="_blank" rel="noopener noreferrer">{d.fonte.titulo}</a> — {d.fonte.orgao}
              {d.fonte.data ? ` (${dataBR(d.fonte.data)})` : ''}
            </p>
          </article>
        ))}
      </div>

      <section className="cartao">
        <h2>Bolsa Família: total pago por mês em 2026</h2>
        <p className="rotulo">Só os meses em que o governo divulgou o total da folha.</p>
        <div className="barras" aria-hidden="true">
          {BOLSA_FAMILIA_MENSAL.map((m) => (
            <div key={m.mes} className="barra" title={`${mesCurto(m.mes)}: ${brlGrande(m.total)} para ${numero(m.familias)} famílias`}>
              <span>{mesCurto(m.mes)}</span>
              <div className="trilho"><div className="preenchimento" style={{ width: `${(m.total / maior) * 100}%` }} /></div>
              <span>{brlGrande(m.total)}</span>
            </div>
          ))}
        </div>
        <div className="tabela-rolagem" tabIndex={0} role="region" aria-label="Tabela (pode rolar para o lado)">
          <table>
            <caption className="rotulo" style={{ textAlign: 'left', paddingBottom: 6 }}>Tabela com os mesmos dados</caption>
            <thead>
              <tr><th>Mês</th><th className="num">Famílias</th><th className="num">Total pago</th><th className="num">Média</th><th>Fonte</th></tr>
            </thead>
            <tbody>
              {BOLSA_FAMILIA_MENSAL.map((m) => (
                <tr key={m.mes}>
                  <td>{mesCurto(m.mes)}</td>
                  <td className="num">{numero(m.familias)}</td>
                  <td className="num">{brlGrande(m.total)}</td>
                  <td className="num">{brl(m.media)}</td>
                  <td><a href={m.fonte.url} target="_blank" rel="noopener noreferrer">Secom</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rotulo" style={{ marginTop: 10 }}>
          A partir de outubro de 2026 os valores do Bolsa Família subiram 15,04%; o MDS estima benefício médio de R$ 777.
        </p>
      </section>

      <section className="cartao">
        <h2>Outros números</h2>
        <ul className="lista-simples">
          {NUMEROS.map((n) => (
            <li key={n.rotulo}>
              <strong>{n.valor}</strong> {n.rotulo}. <a href={n.fonte.url} target="_blank" rel="noopener noreferrer">Fonte: {n.fonte.orgao}</a>
            </li>
          ))}
        </ul>
        <p>
          Para ver os gastos atualizados dia a dia, consulte o{' '}
          <a href="https://portaldatransparencia.gov.br/funcoes/08-assistencia-social" target="_blank" rel="noopener noreferrer">Portal da Transparência</a>.
        </p>
      </section>
    </>
  )
}
