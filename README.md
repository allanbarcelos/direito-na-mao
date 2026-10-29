# Direito na Mão

Guia dos programas de transferência de renda do Brasil, federais e estaduais, com um simulador que diz quais benefícios uma pessoa ou família pode receber, quanto e onde pedir.

Acesse: https://allanbarcelos.github.io/direito-na-mao/

O site não é do governo. Os valores e as regras foram tirados de leis, decretos e páginas oficiais, e cada programa tem o link da fonte. A data da última conferência fica em `src/data/referencias.ts`. O resultado da simulação é uma estimativa; quem concede o benefício é o órgão responsável.

## Por que existe

Quem mais precisa desses benefícios costuma ter menos acesso à informação. As regras estão espalhadas entre ministérios, governos estaduais e leis diferentes, e algumas se cruzam de um jeito pouco intuitivo. O BPC, por exemplo, conta como renda no Bolsa Família, então pedir um segundo BPC pode fazer a família perder o Bolsa Família inteiro. O simulador faz essas contas e mostra a combinação que rende mais.

O público inclui pessoas com pouca familiaridade com celular e com dificuldade de leitura. Por isso o site usa linguagem simples, botões grandes, letra ajustável, alto contraste e leitura em voz alta.

## Rodando localmente

Requer Node.js 24 e npm 11.

```bash
git clone https://github.com/allanbarcelos/direito-na-mao.git
cd direito-na-mao
npm install
npm run dev
```

Outros comandos:

```bash
npm test          # testes (Vitest)
npm run lint      # oxlint
npm run build     # checagem de tipos + build em dist/
npm run preview   # serve o build em http://localhost:4173, com service worker
npm run icones    # gera os PNG do app a partir de public/icone.svg
```

Se o `npm install` falhar com `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, a rede provavelmente usa um proxy que inspeciona HTTPS. Rode com `NODE_OPTIONS=--use-system-ca` para o Node usar os certificados do sistema.

## Stack

React 19 com TypeScript, Vite, React Router (com `HashRouter`), vite-plugin-pwa, Vitest e oxlint. Os ícones são do Bootstrap Icons e a fonte é a Atkinson Hyperlegible; as duas vêm de pacotes npm e entram no build, então o site não depende de CDN.

Não há backend. Os dados ficam no código e o cálculo roda no navegador.

## Organização do código

```
src/
  data/         catálogo dos programas, valores de referência, gastos e locais de atendimento
  calculo/      regras de negócio, sem React
    regras/     uma regra por programa
    simulador.ts
    dicas.ts
  estado/       estado da simulação (funções puras + hook)
  paginas/      telas; o simulador tem um componente por passo
  componentes/  peças reutilizáveis (layout, ícone, perguntas, leitura em voz alta)
  lib/          formatação de valores, armazenamento local, síntese de voz
```

As dependências seguem uma direção só: páginas usam estado e cálculo, o cálculo usa os dados, e dados e regras compartilham os tipos de `calculo/tipos.ts`. Nome, ícone, status e fontes de cada programa existem em um único lugar, `data/catalogo.ts`; as regras só devolvem valores e motivos.

## Como o cálculo funciona

Cada programa tem uma `Regra`: um `programaId` e uma função `avaliar(ctx)` que devolve o que a família recebe naquele programa. O `ctx` traz a família, a renda total e por pessoa, o valor do Bolsa Família no cenário e quem está pedindo BPC.

O simulador:

1. Soma a renda de trabalho, aposentadorias e pensões da casa.
2. Encontra quem poderia pedir BPC: 65 anos ou mais, ou com deficiência, sem aposentadoria e dentro do limite de ¼ do salário mínimo por pessoa. O BPC ou a aposentadoria de até um salário mínimo de outro idoso ou pessoa com deficiência da casa não entra nessa conta (LOAS, art. 20, §14).
3. Monta um cenário para cada combinação de pedidos de BPC (até 6 pessoas), com e sem Bolsa Família. O cenário sem Bolsa Família existe porque alguns programas estaduais não aceitam quem recebe.
4. Em cada cenário, calcula o Bolsa Família primeiro (inclusive a Regra de Proteção) e depois aplica as regras do BPC, dos demais programas federais e do estado.
5. Escolhe o cenário com o maior total mensal permanente e mostra as alternativas.

Benefícios pagos uma vez por ano ou por temporada entram como média mensal. Programas com status `confirmar` (previstos em lei, mas sem prova oficial de pagamento recente) aparecem no resultado sem entrar na soma.

Um caso que os testes cobrem: uma família de 10 pessoas sem renda, com um idoso e um adulto com deficiência. Pedindo BPC só para um deles, recebe R$ 4.512 por mês. Pedindo para os dois, a renda por pessoa passa do limite do Bolsa Família e o total cai.

## Atualizando dados

Os números estão em `src/data/`:

- `referencias.ts`: salário mínimo, valores e limites do Bolsa Família, BPC e Pé-de-Meia, e a `DATA_ATUALIZACAO`
- `programasFederais.ts` e `programasEstaduais.ts`: a ficha de cada programa, com textos, fontes e status
- `gastos.ts`: gastos oficiais exibidos no site
- `locais.ts`: onde pedir, telefones e aplicativos

Ao mudar um valor, atualize a fonte correspondente e a `DATA_ATUALIZACAO`, que aparece no aviso do topo e no rodapé. Se o cálculo mudar, ajuste os valores esperados em `src/calculo/simulador.test.ts`.

Só entram números com fonte oficial: Planalto, Diário Oficial, páginas .gov.br de ministérios, Portal da Transparência e páginas dos governos estaduais. Quando não há confirmação de que um programa continua pagando, ele fica com status `confirmar`.

### Incluindo um programa estadual

Basta adicionar a ficha em `PROGRAMAS_ESTADUAIS`, com a função `avaliar`:

```ts
{
  id: 'xx-meu-programa', uf: 'XX', nome: 'Meu Programa', esfera: 'estadual',
  categoria: 'dinheiro', icone: 'credit-card-2-front-fill',
  resumo: 'Frase curta em linguagem simples.',
  valorTexto: 'R$ 100 por mês',
  paraQuem: ['...'], regras: ['...'], comoPedir: ['...'],
  onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
  fontes: [{ titulo: '...', url: 'https://...', orgao: 'Governo de XX' }],
  avaliar: (ctx) => ctx.rendaPorPessoa <= 218
    ? [{ valorMensal: 100, valorTexto: 'R$ 100 por mês', motivo: 'Renda baixa.' }]
    : [],
},
```

O campo `icone` recebe o nome de um ícone do [Bootstrap Icons](https://icons.getbootstrap.com/), sem o prefixo `bi-`.

### Incluindo um programa federal

Adicione a ficha em `programasFederais.ts` e a regra em `calculo/regras/federais.ts`, dentro de `REGRAS_FEDERAIS`. Programas que mudam a renda da família, como o BPC, ou que outras regras consultam, como o Bolsa Família, são tratados no `simulador.ts`.

## Testes

Os testes ficam ao lado do código (`*.test.ts`) e cobrem:

- o cálculo do Bolsa Família e do BPC
- a escolha do melhor cenário
- os programas estaduais que somam ou excluem o Bolsa Família
- as transformações de estado do simulador
- a integridade do catálogo: ids únicos, fontes em https, toda regra ligada a um programa cadastrado e todo ícone existente no Bootstrap Icons

As páginas também foram verificadas com axe-core (WCAG 2 A e AA) em tela de celular.

## Acessibilidade

- três tamanhos de letra e modo de alto contraste, salvos no aparelho
- leitura em voz alta com a voz do próprio sistema (Web Speech API); valores como "R$ 1.621" são lidos como "1621 reais"
- respostas por botões grandes de Sim e Não, em vez de caixas de marcar
- link para pular ao conteúdo, foco visível e foco levado ao conteúdo ao trocar de página
- gráfico acompanhado de tabela com os mesmos dados
- transições desligadas para quem prefere menos movimento
- versão para impressão do resultado, para levar ao CRAS

## Offline e privacidade

O site é um PWA: depois do primeiro acesso funciona sem internet e pode ser instalado no celular. Novas versões são baixadas sozinhas.

Nenhuma resposta sai do aparelho. Não há servidor, analytics nem cookies. As respostas e as preferências de leitura ficam no `localStorage`, e o botão "Começar do zero" apaga a simulação.

## Deploy

O workflow `.github/workflows/deploy.yml` roda lint, testes e build a cada push na `main` e publica a pasta `dist/` no GitHub Pages. Para funcionar, o repositório precisa estar com **Settings > Pages > Source** em **GitHub Actions**.

Como o build usa caminhos relativos e `HashRouter`, a pasta `dist/` também funciona em qualquer outra hospedagem estática.

## Limitações

- Os valores valem para a data de `DATA_ATUALIZACAO`; mudanças depois disso precisam ser atualizadas à mão.
- Programas municipais não estão incluídos.
- Alguns programas estaduais estão como `confirmar` por falta de fonte oficial recente.
- O total do Bolsa Família em 2026 cobre só os meses em que o governo divulgou a folha.
- Gás do Povo e Tarifa Social aparecem sem valor em reais, porque não há fonte oficial para o preço do botijão ou da tarifa.

## Licença

[MIT](LICENSE). A licença cobre o código; leis e dados públicos citados continuam sendo dos órgãos que os publicam.
