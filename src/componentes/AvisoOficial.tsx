import { Icone } from './Icone'
import { Link } from 'react-router-dom'
import { DATA_ATUALIZACAO } from '../data/referencias'
import { dataBR } from '../lib/formatar'

/** Faixa fixa em todas as páginas: o site não é do governo, mas segue as fontes oficiais. */
export function AvisoOficial() {
  return (
    <div className="aviso-oficial" role="note" aria-label="Aviso sobre o site">
      <p>
        <Icone nome="info-circle-fill" />
        <strong>Este site não é do governo.</strong> As informações seguem as leis e as páginas oficiais
        do governo federal e dos estados, conferidas em {dataBR(DATA_ATUALIZACAO)}.{' '}
        <Link to="/fontes">Ver as fontes oficiais</Link>
      </p>
    </div>
  )
}
