import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { NOME_SITE } from '../config'
import { DATA_ATUALIZACAO } from '../data/referencias'
import { dataBR } from '../lib/formatar'
import { pararFala } from '../lib/falar'
import { Acessibilidade } from './Acessibilidade'

const LINKS = [
  { para: '/', icone: '🏠', texto: 'Início' },
  { para: '/simular', icone: '🧮', texto: 'Simular' },
  { para: '/programas', icone: '📋', texto: 'Programas' },
  { para: '/onde-pedir', icone: '📍', texto: 'Onde pedir' },
  { para: '/gastos', icone: '📊', texto: 'Gastos' },
]

export function Layout() {
  const { pathname } = useLocation()
  const principal = useRef<HTMLElement>(null)

  // Ao trocar de página: volta ao topo, para a leitura e leva o foco ao conteúdo (leitores de tela).
  useEffect(() => {
    window.scrollTo(0, 0)
    pararFala()
    principal.current?.focus()
  }, [pathname])

  return (
    <>
      <a href="#conteudo" className="pular">Pular para o conteúdo</a>
      <header className="topo">
        <Link to="/" className="marca"><span aria-hidden="true">🤝</span>{NOME_SITE}</Link>
        <Acessibilidade />
      </header>
      <nav className="nav" aria-label="Menu principal">
        {LINKS.map((l) => (
          <NavLink key={l.para} to={l.para} end={l.para === '/'}>
            <span aria-hidden="true">{l.icone}</span>
            {l.texto}
          </NavLink>
        ))}
      </nav>
      <main id="conteudo" ref={principal} tabIndex={-1} className="conteudo">
        <Outlet />
        <footer className="rodape">
          <p>
            Dados conferidos em {dataBR(DATA_ATUALIZACAO)} em fontes oficiais do governo.{' '}
            <Link to="/sobre">Sobre e fontes</Link>
          </p>
          <p>Este site não é do governo. É um guia gratuito e não pede seus dados: tudo fica no seu aparelho.</p>
        </footer>
      </main>
    </>
  )
}
