import type { Familia } from '../../calculo/tipos'
import { Contador, SimNao, TituloPergunta } from '../../componentes/Perguntas'
import { NOMES_UF, UFS, type UF } from '../../data/tipos'
import type { Modo } from '../../estado/simulacao'

/** Estados com cidades no semiárido. */
const UF_SEMIARIDO: UF[] = ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE', 'MG', 'ES']

const CADUNICO = [['sim', 'Sim, atualizado'], ['desatualizado', 'Tem, mas está velho'], ['nao', 'Não tem / não sei']] as const

export function PassoModo({ modo, onChange }: { modo: Modo; onChange: (m: Modo) => void }) {
  return (
    <>
      <TituloPergunta texto="Para quem é a simulação?" />
      <div className="opcoes">
        <button type="button" className="opcao" aria-pressed={modo === 'eu'} onClick={() => onChange('eu')}>
          <span aria-hidden="true">🙋</span> Só para mim
        </button>
        <button type="button" className="opcao" aria-pressed={modo === 'familia'} onClick={() => onChange('familia')}>
          <span aria-hidden="true">👨‍👩‍👧‍👦</span> Para minha família
        </button>
      </div>
      <p className="rotulo" style={{ marginTop: 16 }}>
        Dica: os benefícios são calculados para todas as pessoas que moram na mesma casa e dividem as despesas. Para ter o resultado certo, escolha “Para minha família”.
      </p>
    </>
  )
}

export function PassoEstado({ uf, onChange }: { uf: UF | ''; onChange: (uf: UF) => void }) {
  return (
    <>
      <TituloPergunta texto="Em qual estado você mora?" ajuda="Cada estado tem programas próprios." />
      <div className="opcoes">
        {UFS.map((u) => (
          <button key={u} type="button" className="opcao" aria-pressed={uf === u} onClick={() => onChange(u)}>
            {NOMES_UF[u]}
          </button>
        ))}
      </div>
    </>
  )
}

export function PassoQuantidade({ quantidade, onChange }: { quantidade: number; onChange: (q: number) => void }) {
  return (
    <>
      <TituloPergunta texto="Quantas pessoas moram na sua casa?" ajuda="Conte você também, as crianças e os idosos." />
      <Contador rotulo="Pessoas na casa" valor={quantidade} min={1} max={20} onChange={onChange} />
    </>
  )
}

export function PassoFamilia({ familia: f, onChange }: { familia: Familia; onChange: (p: Partial<Familia>) => void }) {
  return (
    <>
      <TituloPergunta texto="Agora, sobre a família" />
      <div className="campo">
        <span className="pergunta" style={{ fontSize: '1.1rem' }}>A família tem Cadastro Único (CadÚnico)?</span>
        <div className="opcoes">
          {CADUNICO.map(([v, t]) => (
            <button key={v} type="button" className="opcao" aria-pressed={f.cadUnico === v} onClick={() => onChange({ cadUnico: v })}>{t}</button>
          ))}
        </div>
      </div>
      <SimNao icone="👨‍👩‍👧" pergunta="A família já recebe Bolsa Família hoje?" valor={f.recebeBolsaFamilia} onChange={(v) => onChange({ recebeBolsaFamilia: v })} />
      {f.uf !== '' && UF_SEMIARIDO.includes(f.uf) && (
        <SimNao icone="🌵" pergunta="Mora numa cidade do semiárido (sertão)?" valor={f.semiarido} onChange={(v) => onChange({ semiarido: v })} />
      )}
      <SimNao
        icone="🌳"
        pergunta="Mora em reserva, floresta protegida ou assentamento?"
        ajuda="Reserva extrativista, floresta nacional, assentamento do INCRA, comunidade ribeirinha protegida."
        valor={f.reservaOuAssentamento}
        onChange={(v) => onChange({ reservaOuAssentamento: v })}
      />
    </>
  )
}
