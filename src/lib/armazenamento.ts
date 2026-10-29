/** localStorage com proteção: em modo privado ou bloqueado, simplesmente não salva. */
export function ler<T>(chave: string, padrao: T): T {
  try {
    const v = localStorage.getItem(chave)
    return v ? (JSON.parse(v) as T) : padrao
  } catch {
    return padrao
  }
}

export function gravar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    /* sem armazenamento disponível */
  }
}

export function apagar(chave: string): void {
  try {
    localStorage.removeItem(chave)
  } catch {
    /* sem armazenamento disponível */
  }
}
