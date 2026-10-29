import type { Fonte } from '../data/tipos'
import { dataBR } from '../lib/formatar'

export function Fontes({ fontes, titulo = 'Fontes oficiais' }: { fontes: Fonte[]; titulo?: string }) {
  return (
    <section className="fontes" aria-label={titulo}>
      <h3>📚 {titulo}</h3>
      <ul className="lista-simples">
        {fontes.map((f) => (
          <li key={f.url + f.titulo}>
            <a href={f.url} target="_blank" rel="noopener noreferrer">{f.titulo}</a>
            {' — '}{f.orgao}{f.data ? ` (${dataBR(f.data)})` : ''}
          </li>
        ))}
      </ul>
    </section>
  )
}
