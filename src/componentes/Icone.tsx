/** Ícone do Bootstrap Icons (decorativo: o texto ao lado já diz o que é). */
export function Icone({ nome, className }: { nome: string; className?: string }) {
  return <i className={`bi bi-${nome}${className ? ` ${className}` : ''}`} aria-hidden="true" />
}
