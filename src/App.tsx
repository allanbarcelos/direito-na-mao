import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './componentes/Layout'
import { Gastos } from './paginas/Gastos'
import { Inicio } from './paginas/Inicio'
import { OndePedir } from './paginas/OndePedir'
import { ProgramaDetalhe, Programas } from './paginas/Programas'
import { Resultado } from './paginas/Resultado'
import { Simulador } from './paginas/simulador/Simulador'
import { Sobre } from './paginas/Sobre'

// HashRouter: funciona em qualquer hospedagem estática, sem configuração de servidor.
export default function App() {
  return (
    <HashRouter>
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
    </HashRouter>
  )
}
