import { useId } from 'react'
import { Ouvir } from './Ouvir'

/** Linha de pergunta com botões grandes "Sim" e "Não". */
export function SimNao({ icone, pergunta, valor, onChange, ajuda }: {
  icone: string; pergunta: string; valor: boolean; onChange: (v: boolean) => void; ajuda?: string
}) {
  const id = useId()
  return (
    <div className="sim-nao" role="group" aria-labelledby={id}>
      <div className="texto">
        <span aria-hidden="true">{icone}</span>
        <span id={id}>
          {pergunta}
          {ajuda && <><br /><small className="rotulo">{ajuda}</small></>}
        </span>
      </div>
      <div className="botoes">
        <button type="button" className="opcao" aria-pressed={valor} onClick={() => onChange(true)}>Sim</button>
        <button type="button" className="opcao" aria-pressed={!valor} onClick={() => onChange(false)}>Não</button>
      </div>
    </div>
  )
}

/** Campo de dinheiro: aceita "1.200,50", "1200" etc. */
export function CampoDinheiro({ rotulo, valor, onChange, ajuda }: {
  rotulo: string; valor: number; onChange: (v: number) => void; ajuda?: string
}) {
  const id = useId()
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        defaultValue={valor ? String(valor).replace('.', ',') : ''}
        onChange={(e) => {
          const limpo = e.target.value.replace(/[^\d,]/g, '').replace(',', '.')
          const n = Number.parseFloat(limpo)
          onChange(Number.isFinite(n) ? n : 0)
        }}
      />
      {ajuda && <span className="ajuda">{ajuda}</span>}
    </div>
  )
}

/** Botões − e + grandes para números pequenos (pessoas, idade). */
export function Contador({ rotulo, valor, onChange, min = 0, max = 120 }: {
  rotulo: string; valor: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  const id = useId()
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <div className="contador">
        <button type="button" className="botao secundario" aria-label={`Diminuir ${rotulo}`} onClick={() => onChange(Math.max(min, valor - 1))} disabled={valor <= min}>−</button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={valor}
          style={{ maxWidth: '7rem', textAlign: 'center', fontSize: '1.8rem', fontWeight: 900 }}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10)
            if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)))
          }}
        />
        <button type="button" className="botao secundario" aria-label={`Aumentar ${rotulo}`} onClick={() => onChange(Math.min(max, valor + 1))} disabled={valor >= max}>+</button>
      </div>
    </div>
  )
}

/** Título de pergunta com botão de ouvir. */
export function TituloPergunta({ texto, ajuda }: { texto: string; ajuda?: string }) {
  return (
    <div>
      <h1 className="pergunta">{texto}</h1>
      {ajuda && <p className="rotulo">{ajuda}</p>}
      <p><Ouvir texto={[texto, ajuda].filter(Boolean).join('. ')} rotulo="Ouvir pergunta" /></p>
    </div>
  )
}
