import type { Locais } from '../dados/esquema'
import json from '../dados/locais.json'
import type { Local } from './tipos'

const dados = json as Locais

export const LOCAIS: Local[] = dados.locais
export const LOCAL_POR_ID = Object.fromEntries(LOCAIS.map((l) => [l.id, l])) as Record<string, Local>
export const CANAIS = dados.canais
export const APLICATIVOS = dados.aplicativos
