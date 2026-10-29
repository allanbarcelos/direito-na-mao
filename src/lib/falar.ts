/** Leitura em voz alta usando a voz do próprio aparelho (Web Speech API). */
export const podeFalar = typeof window !== 'undefined' && 'speechSynthesis' in window

function vozPortugues(): SpeechSynthesisVoice | undefined {
  const vozes = window.speechSynthesis.getVoices()
  return vozes.find((v) => v.lang === 'pt-BR') ?? vozes.find((v) => v.lang.startsWith('pt'))
}

/** Troca "R$ 1.621" por "1621 reais" para a voz ler direito. */
export function prepararTexto(texto: string): string {
  return texto
    .replace(/R\$\s?([\d.]+),(\d{2})/g, (_, i: string, c: string) => `${i.replace(/\./g, '')} reais e ${Number(c)} centavos`)
    .replace(/R\$\s?([\d.]+)/g, (_, i: string) => `${i.replace(/\./g, '')} reais`)
    .replace(/CadÚnico/g, 'Cadastro Único')
    .replace(/\bBPC\b/g, 'B P C')
    .replace(/\bCRAS\b/g, 'Cras')
    .replace(/\bINSS\b/g, 'I N S S')
}

export function falar(texto: string, aoTerminar?: () => void): void {
  if (!podeFalar) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(prepararTexto(texto))
  u.lang = 'pt-BR'
  u.rate = 0.9
  const voz = vozPortugues()
  if (voz) u.voice = voz
  if (aoTerminar) {
    u.onend = aoTerminar
    u.onerror = aoTerminar
  }
  window.speechSynthesis.speak(u)
}

export function pararFala(): void {
  if (podeFalar) window.speechSynthesis.cancel()
}
