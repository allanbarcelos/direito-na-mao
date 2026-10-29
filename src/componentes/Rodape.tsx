import { Link } from 'react-router-dom'
import { AUTORIA, NOME_SITE, REPOSITORIO } from '../config'
import { dataBR } from '../lib/formatar'
import { DATA_ATUALIZACAO } from '../servicos/referencias'
import { Icone } from './Icone'

const NAVEGAR = [
  { para: '/simular', texto: 'Simular benefícios' },
  { para: '/programas', texto: 'Todos os programas' },
  { para: '/onde-pedir', texto: 'Onde pedir' },
  { para: '/gastos', texto: 'Gastos do governo' },
]

const SOBRE = [
  { para: '/sobre', texto: 'Sobre o site' },
  { para: '/fontes', texto: 'Fontes oficiais' },
]

const TELEFONES = [
  { numero: '121', texto: 'Disque Social (Bolsa Família)' },
  { numero: '135', texto: 'INSS (BPC)' },
]

/** Calculado uma vez, ao carregar o site. */
const ANO = new Date().getFullYear()

export function Rodape() {
  return (
    <footer className="rodape">
      <div className="rodape-conteudo">
        <section className="rodape-marca" aria-labelledby="rodape-titulo">
          <h2 id="rodape-titulo" className="rodape-nome">
            <img src={`${import.meta.env.BASE_URL}icone.svg`} alt="" width={32} height={32} />
            {NOME_SITE}
          </h2>
          <p>Guia gratuito para descobrir quais benefícios sociais você e sua família podem receber.</p>
          <p className="rodape-aviso">
            <Icone nome="info-circle-fill" /> Site independente, sem ligação com o governo. Valores e regras
            conferidos em {dataBR(DATA_ATUALIZACAO)} nas fontes oficiais.
          </p>
        </section>

        <nav className="rodape-coluna" aria-label="Navegação do rodapé">
          <h2>Navegar</h2>
          <ul>{NAVEGAR.map((l) => <li key={l.para}><Link to={l.para}>{l.texto}</Link></li>)}</ul>
        </nav>

        <div className="rodape-coluna">
          <h2>Informações</h2>
          <ul>
            {SOBRE.map((l) => <li key={l.para}><Link to={l.para}>{l.texto}</Link></li>)}
            <li><Icone nome="shield-lock-fill" /> Seus dados ficam só no seu aparelho</li>
          </ul>
        </div>

        <div className="rodape-coluna">
          <h2>Telefones gratuitos</h2>
          <ul>
            {TELEFONES.map((t) => (
              <li key={t.numero}><a href={`tel:${t.numero}`}><Icone nome="telephone-fill" /> {t.numero}</a> {t.texto}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rodape-base">
        <p>
          © {ANO} <a href={AUTORIA.url} target="_blank" rel="noopener noreferrer">{AUTORIA.nome}</a>
          <span aria-hidden="true" className="separador">·</span>
          Licença MIT
        </p>
        <a className="rodape-github" href={REPOSITORIO} target="_blank" rel="noopener noreferrer">
          <Icone nome="github" /> Código aberto no GitHub
        </a>
      </div>
    </footer>
  )
}
