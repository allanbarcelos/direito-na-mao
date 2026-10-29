// Gera os ícones PNG do aplicativo a partir de public/icone.svg.
import sharp from 'sharp'

const origem = 'public/icone.svg'
const tamanhos = [
  ['public/icone-192.png', 192],
  ['public/icone-512.png', 512],
  ['public/apple-touch-icon.png', 180],
]

await Promise.all(tamanhos.map(([destino, t]) => sharp(origem).resize(t, t).png().toFile(destino)))
console.log('Ícones gerados.')
