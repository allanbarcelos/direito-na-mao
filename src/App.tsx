import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './componentes/Layout'
import { Gastos } from './paginas/Gastos'
import { Inicio } from './paginas/Inicio'
import { OndePedir } from './paginas/OndePedir'
import { ProgramaDetalhe, Programas } from './paginas/Programas'
import { Resultado } from './paginas/Resultado'
import { Simulador } from './paginas/simulador/Simulador'
import { Sobre } from './paginas/Sobre'

/** Caminho base sem a barra final ('' quando o site está na raiz). */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="simular" element={<Simulador />} />
          <Route path="resultado" element={<Resultado />} />
          <Route path="programas" element={<Programas />} />
          <Route path="programas/:id" element={<ProgramaDetalhe />} />
          <Route path="onde-pedir" element={<OndePedir />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="sobre" element={<Sobre />} />
          <Route path="fontes" element={<Sobre />} />
          <Route path="*" element={<Inicio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
