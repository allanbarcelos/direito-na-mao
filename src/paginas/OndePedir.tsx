import { Ouvir } from '../componentes/Ouvir'
import { APLICATIVOS, CANAIS, LOCAIS } from '../data/locais'

const DOCUMENTOS = [
  'CPF ou título de eleitor do responsável pela família',
  'CPF ou certidão de nascimento de todas as pessoas da casa',
  'Comprovante de endereço (conta de luz ou água), se tiver',
  'Carteira de trabalho e comprovantes de renda, se tiver',
  'Para indígenas e quilombolas: pode ser qualquer documento de identificação',
]

export function OndePedir() {
  const fala = `Para pedir os benefícios, vá ao CRAS da sua cidade e faça o Cadastro Único. Leve: ${DOCUMENTOS.join('; ')}. Telefones gratuitos: Bolsa Família 121, INSS 135, Caixa 111.`
  return (
    <>
      <h1>📍 Onde pedir</h1>
      <p><Ouvir texto={fala} rotulo="Ouvir resumo" /></p>

      <section className="cartao destaque">
        <h2>1º passo: Cadastro Único no CRAS</h2>
        <p>É de graça e não precisa de intermediário. Leve:</p>
        <ul className="lista-simples">{DOCUMENTOS.map((d) => <li key={d}>{d}</li>)}</ul>
        <p>
          <a className="botao" href="https://www.google.com/maps/search/CRAS+perto+de+mim" target="_blank" rel="noopener noreferrer">
            🗺️ Achar o CRAS mais perto no mapa
          </a>
        </p>
      </section>

      <section className="cartao">
        <h2>☎️ Telefones gratuitos</h2>
        <div className="grade">
          {CANAIS.map((c) => (
            <a key={c.numero} href={`tel:${c.numero}`} className="botao secundario" style={{ flexDirection: 'column' }}>
              <span style={{ fontSize: '1.6rem' }}>{c.numero}</span>
              <span>{c.nome}</span>
              <small style={{ fontWeight: 500 }}>{c.para}</small>
            </a>
          ))}
        </div>
      </section>

      <section className="cartao">
        <h2>📱 Aplicativos oficiais</h2>
        <ul className="lista-simples">
          {APLICATIVOS.map((a) => (
            <li key={a.nome}><a href={a.url} target="_blank" rel="noopener noreferrer"><strong>{a.nome}</strong></a> — {a.para}</li>
          ))}
        </ul>
      </section>

      <h2>🏢 Lugares</h2>
      <div className="grade">
        {LOCAIS.map((l) => (
          <article key={l.id} className="cartao">
            <h3><span aria-hidden="true">{l.icone}</span> {l.nome}</h3>
            <p>{l.oQueE}</p>
            <p><strong>Como achar:</strong> {l.comoAchar}</p>
            {l.telefone && <p><a href={`tel:${l.telefone}`}>📞 Ligar {l.telefone}</a></p>}
            {l.link && <p><a href={l.link} target="_blank" rel="noopener noreferrer">Site oficial</a></p>}
          </article>
        ))}
      </div>
    </>
  )
}
