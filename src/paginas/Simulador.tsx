import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CampoDinheiro, Contador, SimNao, TituloPergunta } from '../componentes/Perguntas'
import type { Escola, Pessoa } from '../calculo/tipos'
import { NOMES_UF, UFS, type UF } from '../data/tipos'
import {
  carregarSimulacao, limparSimulacao, novaPessoa, salvarSimulacao, simulacaoVazia, type Simulacao,
} from '../estado/simulacao'

/** Estados com cidades no semiárido. */
const UF_SEMIARIDO: UF[] = ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE', 'MG', 'ES']

const ESCOLAS: { valor: Escola; texto: string; icone: string }[] = [
  { valor: 'nao', texto: 'Não estuda', icone: '🚫' },
  { valor: 'fundamental', texto: 'Ensino fundamental', icone: '✏️' },
  { valor: 'medio', texto: 'Ensino médio', icone: '🎒' },
  { valor: 'faculdade', texto: 'Faculdade', icone: '🎓' },
]

export function Simulador() {
  const navegar = useNavigate()
  const [s, setS] = useState<Simulacao>(carregarSimulacao)
  const [passo, setPasso] = useState(0)

  useEffect(() => {
    salvarSimulacao(s)
  }, [s])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [passo])

  const pessoas = s.familia.pessoas
  const n = pessoas.length
  // passos: 0 modo, 1 estado, 2 quantas pessoas, 3..3+n-1 cada pessoa, 3+n família
  const total = 4 + n
  const passoFamilia = 3 + n

  const mudarFamilia = (parcial: Partial<Simulacao['familia']>) =>
    setS((x) => ({ ...x, familia: { ...x.familia, ...parcial } }))
  const mudarPessoa = (i: number, parcial: Partial<Pessoa>) =>
    setS((x) => ({ ...x, familia: { ...x.familia, pessoas: x.familia.pessoas.map((p, j) => (j === i ? { ...p, ...parcial } : p)) } }))
  const mudarQuantidade = (q: number) =>
    setS((x) => {
      const atuais = x.familia.pessoas
      const novas = q > atuais.length
        ? [...atuais, ...Array.from({ length: q - atuais.length }, () => novaPessoa(10))]
        : atuais.slice(0, q)
      return { ...x, familia: { ...x.familia, pessoas: novas } }
    })

  const avancar = () => {
    if (passo === 1 && s.modo === 'eu') setPasso(3)
    else if (passo >= passoFamilia) navegar('/resultado')
    else setPasso(passo + 1)
  }
  const voltar = () => {
    if (passo === 3 && s.modo === 'eu') setPasso(1)
    else setPasso(Math.max(0, passo - 1))
  }

  let tela: React.ReactNode
  let podeAvancar = true

  if (passo === 0) {
    podeAvancar = s.modo !== ''
    tela = (
      <>
        <TituloPergunta texto="Para quem é a simulação?" />
        <div className="opcoes">
          <button type="button" className="opcao" aria-pressed={s.modo === 'eu'} onClick={() => { setS((x) => ({ ...x, modo: 'eu' })); mudarQuantidade(1) }}>
            <span aria-hidden="true">🙋</span> Só para mim
          </button>
          <button type="button" className="opcao" aria-pressed={s.modo === 'familia'} onClick={() => { setS((x) => ({ ...x, modo: 'familia' })); if (n < 2) mudarQuantidade(2) }}>
            <span aria-hidden="true">👨‍👩‍👧‍👦</span> Para minha família
          </button>
        </div>
        <p className="rotulo" style={{ marginTop: 16 }}>
          Dica: os benefícios são calculados para todas as pessoas que moram na mesma casa e dividem as despesas. Para ter o resultado certo, escolha “Para minha família”.
        </p>
      </>
    )
  } else if (passo === 1) {
    podeAvancar = s.familia.uf !== ''
    tela = (
      <>
        <TituloPergunta texto="Em qual estado você mora?" ajuda="Cada estado tem programas próprios." />
        <div className="opcoes">
          {UFS.map((uf) => (
            <button key={uf} type="button" className="opcao" aria-pressed={s.familia.uf === uf} onClick={() => mudarFamilia({ uf })}>
              {NOMES_UF[uf]}
            </button>
          ))}
        </div>
      </>
    )
  } else if (passo === 2) {
    tela = (
      <>
        <TituloPergunta texto="Quantas pessoas moram na sua casa?" ajuda="Conte você também, as crianças e os idosos." />
        <Contador rotulo="Pessoas na casa" valor={n} min={1} max={20} onChange={mudarQuantidade} />
      </>
    )
  } else if (passo < passoFamilia) {
    const i = passo - 3
    tela = <FormPessoa key={pessoas[i].id} pessoa={pessoas[i]} indice={i} total={n} onChange={(p) => mudarPessoa(i, p)} />
  } else {
    const uf = s.familia.uf
    tela = (
      <>
        <TituloPergunta texto="Agora, sobre a família" />
        <div className="campo">
          <span className="pergunta" style={{ fontSize: '1.1rem' }}>A família tem Cadastro Único (CadÚnico)?</span>
          <div className="opcoes">
            {([['sim', 'Sim, atualizado'], ['desatualizado', 'Tem, mas está velho'], ['nao', 'Não tem / não sei']] as const).map(([v, t]) => (
              <button key={v} type="button" className="opcao" aria-pressed={s.familia.cadUnico === v} onClick={() => mudarFamilia({ cadUnico: v })}>{t}</button>
            ))}
          </div>
        </div>
        <SimNao icone="👨‍👩‍👧" pergunta="A família já recebe Bolsa Família hoje?" valor={s.familia.recebeBolsaFamilia} onChange={(v) => mudarFamilia({ recebeBolsaFamilia: v })} />
        {uf !== '' && UF_SEMIARIDO.includes(uf) && (
          <SimNao icone="🌵" pergunta="Mora numa cidade do semiárido (sertão)?" valor={s.familia.semiarido} onChange={(v) => mudarFamilia({ semiarido: v })} />
        )}
        <SimNao
          icone="🌳"
          pergunta="Mora em reserva, floresta protegida ou assentamento?"
          ajuda="Reserva extrativista, floresta nacional, assentamento do INCRA, comunidade ribeirinha protegida."
          valor={s.familia.reservaOuAssentamento}
          onChange={(v) => mudarFamilia({ reservaOuAssentamento: v })}
        />
      </>
    )
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
          <button type="button" className="ouvir" onClick={() => { limparSimulacao(); setS(simulacaoVazia()) }}>🗑️ Começar do zero</button>
        </p>
      )}
    </>
  )
}

function FormPessoa({ pessoa: p, indice, total, onChange }: {
  pessoa: Pessoa; indice: number; total: number; onChange: (p: Partial<Pessoa>) => void
}) {
  const rotuloIdade = indice === 0 ? 'Sua idade (anos)' : `Idade de ${p.nome.trim() || `pessoa ${indice + 1}`} (anos)`
  const adulto = p.idade >= 16
  const podeGestar = p.idade >= 10 && p.idade <= 55
  return (
    <>
      <TituloPergunta
        texto={indice === 0 ? 'Fale sobre você' : `Pessoa ${indice + 1} de ${total}`}
        ajuda={indice === 0 ? undefined : 'Conte sobre outra pessoa que mora na casa.'}
      />
      {total > 1 && (
        <div className="campo">
          <label htmlFor={`nome-${p.id}`}>Nome ou apelido (não é obrigatório)</label>
          <input id={`nome-${p.id}`} value={p.nome} autoComplete="off" onChange={(e) => onChange({ nome: e.target.value })} placeholder={indice === 0 ? 'Eu' : 'Ex.: Maria, vovó, João'} />
        </div>
      )}
      <Contador rotulo={rotuloIdade} valor={p.idade} min={0} max={120} onChange={(idade) => onChange({ idade })} />

      <SimNao icone="♿" pergunta="Tem alguma deficiência?" ajuda="Física, mental, intelectual, visual, auditiva ou doença que impede a vida normal por mais de 2 anos." valor={p.deficiencia} onChange={(v) => onChange({ deficiencia: v, zika: v && p.zika })} />
      {p.deficiencia && (
        <SimNao icone="🦟" pergunta="A deficiência foi causada pelo vírus Zika?" valor={p.zika} onChange={(v) => onChange({ zika: v })} />
      )}
      {podeGestar && (
        <>
          <SimNao icone="🤰" pergunta="Está grávida?" valor={p.gestante} onChange={(v) => onChange({ gestante: v })} />
          <SimNao icone="🤱" pergunta="Está amamentando?" valor={p.amamentando} onChange={(v) => onChange({ amamentando: v })} />
        </>
      )}
      {adulto && (
        <SimNao icone="👩" pergunta="É mãe ou mulher responsável pela família?" valor={p.responsavel} onChange={(v) => onChange({ responsavel: v })} />
      )}

      {p.idade >= 4 && (
        <div className="campo">
          <span className="pergunta" style={{ fontSize: '1.1rem' }}>Estuda em escola pública?</span>
          <div className="opcoes">
            {ESCOLAS.map((e) => (
              <button key={e.valor} type="button" className="opcao" aria-pressed={p.escola === e.valor} onClick={() => onChange({ escola: e.valor })}>
                <span aria-hidden="true">{e.icone}</span> {e.texto}
              </button>
            ))}
          </div>
        </div>
      )}
      {p.escola === 'medio' && (
        <SimNao icone="⏰" pergunta="Estuda em tempo integral ou curso técnico?" valor={p.integral} onChange={(v) => onChange({ integral: v })} />
      )}
      {p.escola === 'faculdade' && (
        <SimNao icone="🪶" pergunta="É indígena ou quilombola?" valor={p.indigenaQuilombola} onChange={(v) => onChange({ indigenaQuilombola: v })} />
      )}

      {p.idade >= 14 && (
        <>
          <CampoDinheiro
            rotulo={`Quanto ${indice === 0 ? 'você ganha' : 'ganha'} por mês trabalhando? (R$)`}
            ajuda="Some todos os trabalhos, com ou sem carteira (bico, diária, venda). Se não trabalha, deixe 0. Não conte Bolsa Família."
            valor={p.rendaTrabalho}
            onChange={(rendaTrabalho) => onChange({ rendaTrabalho })}
          />
          {p.rendaTrabalho > 0 && (
            <SimNao icone="📘" pergunta="Trabalha com carteira assinada?" valor={p.trabalhoFormal} onChange={(v) => onChange({ trabalhoFormal: v })} />
          )}
          {p.deficiencia && p.trabalhoFormal && (
            <SimNao icone="🔁" pergunta="Recebia BPC antes de começar nesse trabalho?" valor={p.saiuDoBPC} onChange={(v) => onChange({ saiuDoBPC: v })} />
          )}
          <CampoDinheiro
            rotulo="Recebe aposentadoria ou pensão do INSS? Quanto por mês? (R$)"
            ajuda="Se não recebe, deixe 0. Não conte o BPC aqui."
            valor={p.aposentadoria}
            onChange={(aposentadoria) => onChange({ aposentadoria })}
          />
        </>
      )}
      {(p.idade >= 65 || p.deficiencia) && (
        <SimNao icone="🧓" pergunta="Já recebe o BPC (LOAS)?" valor={p.recebeBPC} onChange={(v) => onChange({ recebeBPC: v })} />
      )}
      {adulto && (
        <>
          <SimNao icone="🎣" pergunta="É pescador(a) artesanal?" valor={p.pescador} onChange={(v) => onChange({ pescador: v })} />
          <SimNao icone="🌽" pergunta="Trabalha na roça (agricultura familiar)?" valor={p.agricultor} onChange={(v) => onChange({ agricultor: v })} />
        </>
      )}
    </>
  )
}
