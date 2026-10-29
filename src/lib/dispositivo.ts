/** Celular ou tablet: usa a dica do navegador quando existe, senão o user agent e a tela de toque. */
export function ehCelular(nav: Navigator = navigator, toque = window.matchMedia('(pointer: coarse)').matches): boolean {
  const dica = (nav as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile
  if (dica !== undefined) return dica || (toque && /Android|iPad|Tablet/i.test(nav.userAgent))
  return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(nav.userAgent)
}
