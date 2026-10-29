import { Icone } from '../../componentes/Icone'
import type { Escola, Pessoa } from '../../calculo/tipos'
import { CampoDinheiro, Contador, SimNao, TituloPergunta } from '../../componentes/Perguntas'

const ESCOLAS: { valor: Escola; texto: string; icone: string }[] = [
  { valor: 'nao', texto: 'Não estuda', icone: 'x-circle' },
  { valor: 'fundamental', texto: 'Ensino fundamental', icone: 'pencil-fill' },
  { valor: 'medio', texto: 'Ensino médio', icone: 'backpack' },
  { valor: 'faculdade', texto: 'Faculdade', icone: 'mortarboard-fill' },
]

/** Perguntas sobre uma pessoa da casa. Só mostra o que faz sentido para a idade. */
export function PassoPessoa({ pessoa: p, indice, total, onChange }: {
  pessoa: Pessoa; indice: number; total: number; onChange: (p: Partial<Pessoa>) => void
}) {
  const rotuloIdade = indice === 0 ? 'Sua idade (anos)' : `Idade de ${p.nome.trim() || `pessoa ${indice + 1}`} (anos)`
  const adulto = p.idade >= 16
  const podeGestar = p.sexo === 'feminino' && p.idade >= 10 && p.idade <= 55
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

      <div className="campo" role="group" aria-labelledby={`sexo-${p.id}`}>
        <span id={`sexo-${p.id}`} className="pergunta" style={{ fontSize: '1.1rem' }}>Sexo (como está no documento)</span>
        <span className="ajuda">Alguns programas são só para mulheres. Use o que aparece no RG ou na certidão.</span>
        <div className="opcoes">
          <button type="button" className="opcao" aria-pressed={p.sexo === 'feminino'} onClick={() => onChange({ sexo: 'feminino' })}>Feminino</button>
          <button type="button" className="opcao" aria-pressed={p.sexo === 'masculino'} onClick={() => onChange({ sexo: 'masculino', gestante: false, amamentando: false })}>Masculino</button>
        </div>
      </div>

      <SimNao icone="person-wheelchair" pergunta="Tem alguma deficiência?" ajuda="Física, mental, intelectual, visual, auditiva ou doença que impede a vida normal por mais de 2 anos." valor={p.deficiencia} onChange={(v) => onChange({ deficiencia: v, zika: v && p.zika })} />
      {p.deficiencia && (
        <SimNao icone="bug-fill" pergunta="A deficiência foi causada pelo vírus Zika?" valor={p.zika} onChange={(v) => onChange({ zika: v })} />
      )}
      {podeGestar && (
        <>
          <SimNao icone="heart-pulse" pergunta="Está grávida?" valor={p.gestante} onChange={(v) => onChange({ gestante: v })} />
          <SimNao icone="heart-fill" pergunta="Está amamentando?" valor={p.amamentando} onChange={(v) => onChange({ amamentando: v })} />
        </>
      )}
      {adulto && (
        <SimNao icone="person-fill" pergunta="É a pessoa responsável pela família?" ajuda="Quem cuida da casa e das contas. No CadÚnico é chamada de “responsável familiar”." valor={p.responsavel} onChange={(v) => onChange({ responsavel: v })} />
      )}

      {p.idade >= 4 && (
        <div className="campo">
          <span className="pergunta" style={{ fontSize: '1.1rem' }}>Estuda em escola pública?</span>
          <div className="opcoes">
            {ESCOLAS.map((e) => (
              <button key={e.valor} type="button" className="opcao" aria-pressed={p.escola === e.valor} onClick={() => onChange({ escola: e.valor })}>
                <Icone nome={e.icone} /> {e.texto}
              </button>
            ))}
          </div>
        </div>
      )}
      {p.escola === 'medio' && (
        <SimNao icone="clock-fill" pergunta="Estuda em tempo integral ou curso técnico?" valor={p.integral} onChange={(v) => onChange({ integral: v })} />
      )}
      {p.escola === 'faculdade' && (
        <SimNao icone="feather" pergunta="É indígena ou quilombola?" valor={p.indigenaQuilombola} onChange={(v) => onChange({ indigenaQuilombola: v })} />
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
            <SimNao icone="person-vcard-fill" pergunta="Trabalha com carteira assinada?" valor={p.trabalhoFormal} onChange={(v) => onChange({ trabalhoFormal: v })} />
          )}
          {p.deficiencia && p.trabalhoFormal && (
            <SimNao icone="arrow-repeat" pergunta="Recebia BPC antes de começar nesse trabalho?" valor={p.saiuDoBPC} onChange={(v) => onChange({ saiuDoBPC: v })} />
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
        <SimNao icone="person-heart" pergunta="Já recebe o BPC (LOAS)?" valor={p.recebeBPC} onChange={(v) => onChange({ recebeBPC: v })} />
      )}
      {adulto && (
        <>
          <SimNao icone="water" pergunta="É pescador(a) artesanal?" valor={p.pescador} onChange={(v) => onChange({ pescador: v })} />
          <SimNao icone="flower1" pergunta="Trabalha na roça (agricultura familiar)?" valor={p.agricultor} onChange={(v) => onChange({ agricultor: v })} />
        </>
      )}
    </>
  )
}
