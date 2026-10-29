import { useEffect, useState } from 'react'
import { falar, pararFala, podeFalar } from '../lib/falar'

/** Botão que lê o texto em voz alta. Não aparece se o aparelho não tiver voz. */
export function Ouvir({ texto, rotulo = 'Ouvir' }: { texto: string; rotulo?: string }) {
  const [falando, setFalando] = useState(false)
  useEffect(() => () => pararFala(), [])
  if (!podeFalar) return null
  return (
    <button
      type="button"
      className="ouvir"
      aria-pressed={falando}
      onClick={() => {
        if (falando) {
          pararFala()
          setFalando(false)
        } else {
          setFalando(true)
          falar(texto, () => setFalando(false))
        }
      }}
    >
      <span aria-hidden="true">{falando ? '⏹️' : '🔊'}</span>
      {falando ? 'Parar' : rotulo}
    </button>
  )
}
