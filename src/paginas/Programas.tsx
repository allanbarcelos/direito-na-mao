import { Icone } from '../componentes/Icone'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Fontes } from '../componentes/Fontes'
import { Ouvir } from '../componentes/Ouvir'
import { LOCAL_POR_ID } from '../servicos/locais'
import { ESTADOS_SEM_PROGRAMA, PROGRAMAS, PROGRAMAS_ESTADUAIS, PROGRAMAS_FEDERAIS, programaPorId } from '../servicos/catalogo'
import { NOMES_UF, UFS, type Categoria, type Programa, type UF } from '../servicos/tipos'
import { carregarSimulacao } from '../estado/simulacao'
import { dataBR } from '../lib/formatar'

const CATEGORIA: Record<Categoria, { texto: string; icone: string }> = {
  dinheiro: { texto: 'Dinheiro', icone: 'cash-stack' },
  poupanca: { texto: 'Dinheiro + poupança', icone: 'piggy-bank-fill' },
  produto: { texto: 'Produto', icone: 'gift-fill' },
  desconto: { texto: 'Desconto', icone: 'tag-fill' },
  trabalhista: { texto: 'Trabalhista', icone: 'briefcase-fill' },
}

function Categoria({ c }: { c: Categoria }) {
  return <><Icone nome={CATEGORIA[c].icone} /> {CATEGORIA[c].texto}</>
}

const semAcento = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function Programas() {
  const [uf, setUf] = useState<UF | ''>(() => carregarSimulacao().familia.uf)
  const [busca, setBusca] = useState('')

  const filtro = (p: Programa) => {
    if (!busca.trim()) return true
    const q = semAcento(busca)
    return semAcento(`${p.nome} ${p.resumo} ${p.uf ? NOMES_UF[p.uf] : ''}`).includes(q)
  }
  const federais = PROGRAMAS_FEDERAIS.filter(filtro)
  const estaduais = useMemo(
    () => PROGRAMAS_ESTADUAIS.filter((p) => (uf ? p.uf === uf : true)),
    [uf],
  ).filter(filtro)

  return (
    <>
      <h1><Icone nome="card-list" /> Todos os programas</h1>
      <p>{PROGRAMAS.length} programas de transferência de renda, com valores de 2026 e links para as fontes oficiais.</p>

      <div className="campo busca">
        <label htmlFor="busca">Procurar programa</label>
        <input id="busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: gás, idoso, estudante" />
      </div>

      <h2><Icone nome="globe-americas" /> Federais — valem em todo o Brasil ({federais.length})</h2>
      <div className="grade">{federais.map((p) => <CartaoPrograma key={p.id} p={p} />)}</div>

      <h2 style={{ marginTop: 24 }}><Icone nome="map-fill" /> Estaduais</h2>
      <div className="campo">
        <label htmlFor="uf">Escolha o estado</label>
        <select id="uf" value={uf} onChange={(e) => setUf(e.target.value as UF | '')}>
          <option value="">Todos os estados</option>
          {UFS.map((u) => <option key={u} value={u}>{NOMES_UF[u]}</option>)}
        </select>
      </div>
      {uf && ESTADOS_SEM_PROGRAMA.includes(uf) && (
        <div className="cartao aviso">
          <p>Não encontramos programa estadual de transferência de renda ativo em <strong>{NOMES_UF[uf]}</strong>. Os programas federais continuam valendo. Pergunte no CRAS sobre programas da sua cidade.</p>
        </div>
      )}
      <div className="grade">{estaduais.map((p) => <CartaoPrograma key={p.id} p={p} />)}</div>
    </>
  )
}

function CartaoPrograma({ p }: { p: Programa }) {
  return (
    <article className="cartao">
      <h3><Icone nome={p.icone} /> {p.nome}</h3>
      <p>
        {p.uf && <span className="etiqueta">{NOMES_UF[p.uf]}</span>}{' '}
        <span className="etiqueta verde"><Categoria c={p.categoria} /></span>{' '}
        {p.status === 'confirmar' && <span className="etiqueta amarela">Confirmar se ainda paga</span>}
      </p>
      <p><strong>{p.valorTexto}</strong></p>
      <p>{p.resumo}</p>
      <Link to={`/programas/${p.id}`} className="botao secundario" aria-label={`Ver detalhes de ${p.nome}`}>Ver regras e como pedir</Link>
    </article>
  )
}

export function ProgramaDetalhe() {
  const { id } = useParams()
  const p = id ? programaPorId(id) : undefined
  if (!p) {
    return (
      <section className="cartao">
        <h1>Programa não encontrado</h1>
        <Link to="/programas" className="botao">Voltar para a lista</Link>
      </section>
    )
  }
  const fala = [
    p.nome, p.resumo, `Valor: ${p.valorTexto}.`, 'Quem pode receber:', ...p.paraQuem,
    'Regras:', ...p.regras, 'Como pedir:', ...p.comoPedir,
  ].join(' ')
  const acumula = { sim: 'Sim', nao: 'Não', incerto: 'Não há regra oficial clara' }[p.acumulaBolsaFamilia]

  return (
    <>
      <p><Link to="/programas"><Icone nome="arrow-left" /> Todos os programas</Link></p>
      <section className="cartao destaque">
        <h1><Icone nome={p.icone} /> {p.nome}</h1>
        <p>
          <span className="etiqueta verde">{p.esfera === 'federal' ? 'Federal' : `Estadual — ${p.uf ? NOMES_UF[p.uf] : ''}`}</span>{' '}
          <span className="etiqueta"><Categoria c={p.categoria} /></span>
        </p>
        <p style={{ fontSize: '1.15rem' }}>{p.resumo}</p>
        <p className="valor-grande" style={{ fontSize: '1.8rem' }}>{p.valorTexto}</p>
        <Ouvir texto={fala} rotulo="Ouvir tudo" />
      </section>

      {p.status === 'confirmar' && (
        <div className="cartao aviso">
          <strong><Icone nome="exclamation-triangle-fill" /> Atenção:</strong> {p.observacao ?? 'Não encontramos prova de pagamento recente.'} Confirme no CRAS ou no site oficial antes de contar com este dinheiro.
        </div>
      )}

      <section className="cartao">
        <h2><Icone nome="people-fill" /> Quem pode receber</h2>
        <ul className="lista-simples">{p.paraQuem.map((t) => <li key={t}>{t}</li>)}</ul>
        <h2><Icone nome="list-check" /> Regras e valores</h2>
        <ul className="lista-simples">{p.regras.map((t) => <li key={t}>{t}</li>)}</ul>
        <p><strong>Pode somar com o Bolsa Família?</strong> {acumula}</p>
        {p.status === 'ativo' && p.observacao && <p className="rotulo">{p.observacao}</p>}
      </section>

      <section className="cartao">
        <h2><Icone nome="list-ol" /> Como pedir</h2>
        <ol className="passos">{p.comoPedir.map((t) => <li key={t}>{t}</li>)}</ol>
        {p.onde.length > 0 && (
          <>
            <h3>Onde ir</h3>
            <ul className="lista-simples">
              {p.onde.map((o) => LOCAL_POR_ID[o]).filter(Boolean).map((l) => (
                <li key={l.id}>
                  <strong><Icone nome={l.icone} /> {l.nome}</strong>{l.telefone ? <> — <a href={`tel:${l.telefone}`}>ligue {l.telefone}</a></> : ''}. {l.comoAchar}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="cartao">
        <Fontes fontes={p.fontes} />
        <p className="rotulo">Dados conferidos em {dataBR(p.conferido)}.</p>
      </section>
    </>
  )
}
