import { Icone } from './Icone'
import { useEffect, useState } from 'react'
import { ehCelular } from '../lib/dispositivo'

interface EventoInstalar extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Botão "Instalar no celular": só em celular/tablet e quando o navegador permite instalar. */
export function Instalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null)

  useEffect(() => {
    if (!ehCelular()) return
    const pegar = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalar)
    }
    window.addEventListener('beforeinstallprompt', pegar)
    return () => window.removeEventListener('beforeinstallprompt', pegar)
  }, [])

  if (!evento) return null
  return (
    <div className="cartao aviso nao-imprimir">
      <p><strong><Icone nome="phone-fill" /> Coloque este site na tela do seu celular.</strong> Ele funciona até sem internet depois de instalado.</p>
      <button
        type="button"
        className="botao"
        onClick={async () => {
          await evento.prompt()
          await evento.userChoice
          setEvento(null)
        }}
      >
        Instalar no celular
      </button>
    </div>
  )
}
