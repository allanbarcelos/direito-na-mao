import { Icone } from '../componentes/Icone'
import { Link } from 'react-router-dom'
import { Instalar } from '../componentes/Instalar'
import { Ouvir } from '../componentes/Ouvir'
import { NOME_SITE, SLOGAN } from '../config'
import { DESTAQUES } from '../data/gastos'
import { PROGRAMAS_ESTADUAIS } from '../data/programasEstaduais'
import { PROGRAMAS_FEDERAIS } from '../data/programasFederais'
import { BOLSA_FAMILIA, SALARIO_MINIMO } from '../data/referencias'
import { brl, brlGrande, dataBR } from '../lib/formatar'

export function Inicio() {
  const gasto = DESTAQUES[0]
  const intro = `${SLOGAN}. Responda algumas perguntas simples e veja quanto pode receber, e onde pedir. É de graça e seus dados não saem do seu celular.`
  return (
    <>
      <section className="cartao destaque">
        <h1>{NOME_SITE}</h1>
        <p style={{ fontSize: '1.2rem' }}>{intro}</p>
        <p><Ouvir texto={intro} rotulo="Ouvir explicação" /></p>
        <Link to="/simular" className="botao grande">
          <Icone nome="calculator-fill" /> Descobrir meus benefícios
        </Link>
      </section>

      <Instalar />

      <section className="cartao" aria-labelledby="gasto-titulo">
        <h2 id="gasto-titulo"><Icone nome="cash-coin" /> Quanto o Brasil já gastou</h2>
        <p className="rotulo">{gasto.titulo} — {gasto.periodo}</p>
        <p className="valor-grande">{brlGrande(gasto.valor)}</p>
        <p>{gasto.detalhe}</p>
        <p className="fontes">
          Fonte: <a href={gasto.fonte.url} target="_blank" rel="noopener noreferrer">{gasto.fonte.titulo}</a>
          {gasto.fonte.data ? `, consultado em ${dataBR(gasto.fonte.data)}` : ''}
        </p>
        <Link to="/gastos" className="botao secundario">Ver mais números</Link>
      </section>

      <section className="grade" aria-label="Valores principais">
        <div className="cartao">
          <p className="rotulo">Bolsa Família — mínimo por família</p>
          <p className="valor-grande">{brl(BOLSA_FAMILIA.minimoFamilia)}</p>
          <p>Para famílias com renda de até {brl(BOLSA_FAMILIA.linhaEntrada)} por pessoa.</p>
        </div>
        <div className="cartao">
          <p className="rotulo">BPC — idoso 65+ ou pessoa com deficiência</p>
          <p className="valor-grande">{brl(SALARIO_MINIMO)}</p>
          <p>Um salário mínimo por mês, sem precisar ter contribuído.</p>
        </div>
        <div className="cartao">
          <p className="rotulo">Programas neste guia</p>
          <p className="valor-grande">{PROGRAMAS_FEDERAIS.length + PROGRAMAS_ESTADUAIS.length}</p>
          <p>{PROGRAMAS_FEDERAIS.length} federais e {PROGRAMAS_ESTADUAIS.length} estaduais, todos com fonte oficial.</p>
        </div>
      </section>

      <section className="cartao aviso">
        <h2><Icone nome="star-fill" /> O primeiro passo é sempre o mesmo</h2>
        <p>
          Quase todo benefício depende do <strong>Cadastro Único (CadÚnico)</strong>. Ele é feito de graça no
          <strong> CRAS</strong> da sua cidade. Leve o CPF de todas as pessoas da casa e um comprovante de endereço.
        </p>
        <Link to="/onde-pedir" className="botao secundario">Onde fica o CRAS e o que levar</Link>
      </section>

      <section className="cartao">
        <h2><Icone nome="exclamation-triangle-fill" /> Cuidado com golpes</h2>
        <ul className="lista-simples">
          <li>Nenhum benefício do governo cobra taxa para ser liberado.</li>
          <li>Não passe sua senha do gov.br, do Caixa Tem ou do Meu INSS para ninguém.</li>
          <li>Os telefones oficiais são gratuitos: 121 (Bolsa Família) e 135 (INSS).</li>
        </ul>
      </section>
    </>
  )
}
