import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Ouvir } from '../componentes/Ouvir'
import { simular } from '../calculo/simulador'
import type { BeneficioCalculado, Cenario } from '../calculo/tipos'
import { LOCAL_POR_ID } from '../data/locais'
import { PROGRAMAS_ESTADUAIS } from '../data/programasEstaduais'
import { PROGRAMAS_FEDERAIS } from '../data/programasFederais'
import { NOMES_UF } from '../data/tipos'
import { carregarSimulacao } from '../estado/simulacao'
import { brl } from '../lib/formatar'

const PROGRAMAS = [...PROGRAMAS_FEDERAIS, ...PROGRAMAS_ESTADUAIS]
const programa = (id: string) => PROGRAMAS.find((p) => p.id === id)

export function Resultado() {
  const sim = useMemo(() => carregarSimulacao(), [])
  const r = useMemo(() => (sim.modo ? simular(sim.familia) : null), [sim])

  if (!r) {
    return (
      <section className="cartao">
        <h1>Ainda não há simulação</h1>
        <p>Responda algumas perguntas para ver seus benefícios.</p>
        <Link to="/simular" className="botao grande">Começar</Link>
      </section>
    )
  }

  const m = r.melhor
  const emDinheiro = m.beneficios.filter((b) => b.valorMensal > 0)
  const outros = m.beneficios.filter((b) => b.valorMensal === 0)
  const onde = [...new Set(m.beneficios.flatMap((b) => programa(b.programaId)?.onde ?? []))]
  const temporarios = m.totalComTemporarios - m.totalPermanente
  const fala = [
    m.beneficios.length === 0
      ? 'Pelas respostas, não encontramos benefícios de transferência de renda para esta família.'
      : `Pelas suas respostas, ${r.pessoas > 1 ? 'a família pode' : 'você pode'} receber cerca de ${brl(m.totalPermanente)} por mês.`,
    temporarios > 0 ? `Mais ${brl(temporarios)} por mês por tempo limitado.` : '',
    ...emDinheiro.map((b) => `${b.nome}${b.pessoa ? ` para ${b.pessoa}` : ''}: ${b.valorTexto}.`),
    ...outros.map((b) => `${b.nome}: ${b.valorTexto}.`),
    'O que fazer:',
    ...r.dicas,
  ].filter(Boolean).join(' ')

  return (
    <>
      <section className="cartao destaque" aria-live="polite">
        <h1>{r.pessoas > 1 ? 'Sua família pode receber' : 'Você pode receber'}</h1>
        <p className="valor-grande">{brl(m.totalPermanente)} <small style={{ fontSize: '1.2rem' }}>por mês</small></p>
        {temporarios > 0 && (
          <p><strong>+ {brl(temporarios)} por mês</strong> por tempo limitado (veja abaixo).</p>
        )}
        <p>Isso dá cerca de <strong>{brl(Math.round(m.totalPermanente * 12))} por ano</strong>, somando {m.beneficios.length} benefício(s).</p>
        <p className="rotulo">
          Renda considerada: {brl(r.rendaPorPessoa)} por pessoa, {r.pessoas} pessoa(s)
          {sim.familia.uf ? `, ${NOMES_UF[sim.familia.uf]}` : ''}.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className="nao-imprimir">
          <Ouvir texto={fala} rotulo="Ouvir resultado" />
          <button type="button" className="ouvir" onClick={() => window.print()}>🖨️ Imprimir para levar ao CRAS</button>
        </div>
      </section>

      {r.dicas.length > 0 && (
        <section className="cartao aviso">
          <h2>📝 O que fazer agora</h2>
          <ol className="passos">
            {r.dicas.map((d) => <li key={d}>{d}</li>)}
          </ol>
        </section>
      )}

      {emDinheiro.length > 0 && (
        <section>
          <h2>💵 Benefícios em dinheiro</h2>
          {emDinheiro.map((b, i) => <CartaoBeneficio key={`${b.programaId}-${i}`} b={b} />)}
        </section>
      )}

      {outros.length > 0 && (
        <section>
          <h2>🎁 Outros direitos (produto, desconto ou valor especial)</h2>
          {outros.map((b, i) => <CartaoBeneficio key={`${b.programaId}-${i}`} b={b} />)}
        </section>
      )}

      {m.beneficios.length === 0 && (
        <section className="cartao">
          <h2>Não encontramos benefícios pelas respostas</h2>
          <p>Isso pode acontecer quando a renda está acima dos limites. Mesmo assim, vale procurar o CRAS: há serviços e programas municipais que este guia não cobre.</p>
        </section>
      )}

      {onde.length > 0 && (
        <section className="cartao">
          <h2>📍 Onde ir</h2>
          <ul className="lista-simples">
            {onde.map((id) => LOCAL_POR_ID[id]).filter(Boolean).map((l) => (
              <li key={l.id}>
                <strong>{l.icone} {l.nome}</strong>{l.telefone ? <> — ligue <a href={`tel:${l.telefone}`}>{l.telefone}</a></> : ''}
                <br />{l.comoAchar}
              </li>
            ))}
          </ul>
          <Link to="/onde-pedir" className="botao secundario">Ver todos os lugares e telefones</Link>
        </section>
      )}

      {r.alternativas.length > 0 && (
        <section className="cartao">
          <h2>⚖️ Comparamos outras combinações</h2>
          <p>O sistema testou {r.alternativas.length + 1} formas de pedir os benefícios e mostrou acima a que rende mais todo mês. Veja as outras:</p>
          <div className="tabela-rolagem">
            <table>
              <thead><tr><th>Combinação</th><th className="num">Por mês</th><th className="num">Com temporários</th></tr></thead>
              <tbody>
                <LinhaCenario c={m} melhor />
                {r.alternativas.map((c) => <LinhaCenario key={c.descricao + c.totalPermanente} c={c} />)}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {r.aConfirmar.length > 0 && (
        <section className="cartao">
          <h2>❓ Pode existir no seu estado — confirme</h2>
          <p>Estes programas estão em lei, mas não achamos prova de pagamento recente. <strong>Não entram na soma.</strong> Pergunte no CRAS.</p>
          {r.aConfirmar.map((b, i) => <CartaoBeneficio key={`${b.programaId}-c${i}`} b={b} />)}
        </section>
      )}

      <section className="cartao">
        <h2>ℹ️ Importante</h2>
        <ul className="lista-simples">
          <li>Isto é uma <strong>simulação</strong>. Quem decide é o órgão que paga, depois de analisar o cadastro e os documentos.</li>
          <li>Na soma mensal, benefícios pagos por ano ou por temporada aparecem como média por mês.</li>
          <li>Responda sempre a verdade no CadÚnico: informação falsa faz perder o benefício e pode obrigar a devolver o dinheiro.</li>
        </ul>
        <div className="navegacao-passos nao-imprimir">
          <Link to="/simular" className="botao secundario">✏️ Mudar respostas</Link>
          <Link to="/programas" className="botao secundario">📋 Ver todos os programas</Link>
        </div>
      </section>
    </>
  )
}

function CartaoBeneficio({ b }: { b: BeneficioCalculado }) {
  const p = programa(b.programaId)
  return (
    <article className="cartao beneficio">
      <span className="icone" aria-hidden="true">{b.icone}</span>
      <h3 style={{ margin: 0 }}>
        {b.nome}{b.pessoa ? <span className="rotulo"> — {b.pessoa}</span> : null}
      </h3>
      <div>
        <span className="valor">{b.valorTexto}</span>{' '}
        <span className={`etiqueta ${b.esfera === 'federal' ? 'verde' : ''}`}>{b.esfera === 'federal' ? 'Federal' : 'Estadual'}</span>{' '}
        {b.temporario && <span className="etiqueta amarela">Temporário: {b.temporario}</span>}
      </div>
      <div>
        <p style={{ margin: '6px 0 0' }}>{b.motivo}</p>
        {b.avisos.length > 0 && <ul>{b.avisos.map((a) => <li key={a}>{a}</li>)}</ul>}
        {p && <p style={{ margin: '8px 0 0' }}><Link to={`/programas/${p.id}`}>Como pedir e fontes oficiais →</Link></p>}
      </div>
    </article>
  )
}

function LinhaCenario({ c, melhor }: { c: Cenario; melhor?: boolean }) {
  return (
    <tr style={melhor ? { fontWeight: 800 } : undefined}>
      <td>{melhor ? '✅ ' : ''}{c.descricao}</td>
      <td className="num">{brl(c.totalPermanente)}</td>
      <td className="num">{brl(c.totalComTemporarios)}</td>
    </tr>
  )
}
