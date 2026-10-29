import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulacao } from '../../estado/useSimulacao'
import { PassoPessoa } from './PassoPessoa'
import { PassoEstado, PassoFamilia, PassoModo, PassoQuantidade } from './PassosGerais'

// Passos: 0 modo, 1 estado, 2 quantas pessoas, 3..3+n-1 cada pessoa, 3+n família.
const PASSO_ESTADO = 1
const PASSO_QUANTIDADE = 2
const PRIMEIRA_PESSOA = 3

/** Orquestra os passos do simulador; cada passo é um componente próprio. */
export function Simulador() {
  const navegar = useNavigate()
  const { simulacao: s, escolherModo, mudarQuantidade, mudarFamilia, mudarPessoa, recomecar } = useSimulacao()
  const [passo, setPasso] = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [passo])

  const pessoas = s.familia.pessoas
  const n = pessoas.length
  const passoFamilia = PRIMEIRA_PESSOA + n
  const total = passoFamilia + 1
  const soEu = s.modo === 'eu'

  const avancar = () => {
    if (passo === PASSO_ESTADO && soEu) setPasso(PRIMEIRA_PESSOA)
    else if (passo >= passoFamilia) navegar('/resultado')
    else setPasso(passo + 1)
  }
  const voltar = () => {
    if (passo === PRIMEIRA_PESSOA && soEu) setPasso(PASSO_ESTADO)
    else setPasso(Math.max(0, passo - 1))
  }

  let tela: React.ReactNode
  let podeAvancar = true
  if (passo === 0) {
    podeAvancar = s.modo !== ''
    tela = <PassoModo modo={s.modo} onChange={escolherModo} />
  } else if (passo === PASSO_ESTADO) {
    podeAvancar = s.familia.uf !== ''
    tela = <PassoEstado uf={s.familia.uf} onChange={(uf) => mudarFamilia({ uf })} />
  } else if (passo === PASSO_QUANTIDADE) {
    tela = <PassoQuantidade quantidade={n} onChange={mudarQuantidade} />
  } else if (passo < passoFamilia) {
    const i = passo - PRIMEIRA_PESSOA
    tela = <PassoPessoa key={pessoas[i].id} pessoa={pessoas[i]} indice={i} total={n} onChange={(p) => mudarPessoa(i, p)} />
  } else {
    tela = <PassoFamilia familia={s.familia} onChange={mudarFamilia} />
  }

  return (
    <>
      <div className="progresso" role="progressbar" aria-label="Andamento" aria-valuemin={1} aria-valuemax={total} aria-valuenow={passo + 1}>
        <div style={{ width: `${((passo + 1) / total) * 100}%` }} />
      </div>
      <p className="rotulo">Passo {passo + 1} de {total}</p>
      <section className="cartao">{tela}</section>
      <div className="navegacao-passos">
        {passo > 0 && <button type="button" className="botao secundario" onClick={voltar}>⬅️ Voltar</button>}
        <button type="button" className="botao" onClick={avancar} disabled={!podeAvancar}>
          {passo >= passoFamilia ? 'Ver resultado ✅' : 'Continuar ➡️'}
        </button>
      </div>
      {passo === 0 && s.modo !== '' && (
        <p style={{ marginTop: 16 }}>
          <button type="button" className="ouvir" onClick={recomecar}>🗑️ Começar do zero</button>
        </p>
      )}
    </>
  )
}
