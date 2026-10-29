import { Icone } from './Icone'
import { useEffect, useState } from 'react'
import { gravar, ler } from '../lib/armazenamento'

type Fonte = 'normal' | 'grande' | 'enorme'
interface Preferencias { fonte: Fonte; contraste: boolean }

const CHAVE = 'preferencias'
const ORDEM: Fonte[] = ['normal', 'grande', 'enorme']

function aplicar(p: Preferencias) {
  const raiz = document.documentElement
  raiz.dataset.fonte = p.fonte
  if (p.contraste) raiz.dataset.contraste = 'alto'
  else delete raiz.dataset.contraste
}

/** Botões no topo: aumentar/diminuir letra e alto contraste. */
export function Acessibilidade() {
  const [p, setP] = useState<Preferencias>(() => ler(CHAVE, { fonte: 'normal', contraste: false }))

  useEffect(() => {
    aplicar(p)
    gravar(CHAVE, p)
  }, [p])

  const i = ORDEM.indexOf(p.fonte)
  return (
    <div className="acessibilidade" role="group" aria-label="Ajustes de leitura">
      <button type="button" onClick={() => setP({ ...p, fonte: ORDEM[Math.max(0, i - 1)] })} disabled={i === 0} aria-label="Diminuir letra">
        A−
      </button>
      <button type="button" onClick={() => setP({ ...p, fonte: ORDEM[Math.min(2, i + 1)] })} disabled={i === 2} aria-label="Aumentar letra">
        A+
      </button>
      <button type="button" aria-pressed={p.contraste} onClick={() => setP({ ...p, contraste: !p.contraste })} aria-label="Alto contraste">
        <Icone nome="circle-half" /> Contraste
      </button>
    </div>
  )
}
