# Direito na Mão

Guia dos programas de transferência de renda do Brasil, federais e estaduais, com um simulador que diz quais benefícios uma pessoa ou família pode receber, quanto e onde pedir.

Acesse: https://allanbarcelos.github.io/direito-na-mao/

O site não é do governo. Os valores e as regras foram tirados de leis, decretos e páginas oficiais, e cada programa tem o link da fonte. A data da última conferência fica em `src/dados/referencias.json`. O resultado da simulação é uma estimativa; quem concede o benefício é o órgão responsável.

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

Não há backend. Os dados ficam em arquivos JSON dentro do repositório e o cálculo roda no navegador. A revisão periódica dos dados usa um modelo de IA por API, mas só no GitHub Actions; o site publicado não chama nenhuma API.

## Organização do código

```
src/
  dados/        o "banco": programas.json, referencias.json, gastos.json, locais.json e o esquema (zod)
  servicos/     leem os JSON e entregam os dados tipados ao resto do app
  calculo/      regras de negócio, sem React
    regras/     interpretador das regras do JSON, mais o código do BPC e do Bolsa Família
    simulador.ts
    dicas.ts
  estado/       estado da simulação (funções puras + hook)
  paginas/      telas; o simulador tem um componente por passo
  componentes/  peças reutilizáveis (layout, ícone, perguntas, leitura em voz alta)
  lib/          formatação de valores, armazenamento local, síntese de voz
scripts/
  revisar-programas.ts   revisão automática dos dados com IA
  revisao/               cliente da API, prompts e validação das respostas
```

Tudo o que muda com o tempo (programas, valores, limites de renda, regras de cálculo, fontes, gastos) está em `src/dados/`. Atualizar um valor ou incluir um programa significa editar JSON, sem mexer no código do site. O esquema em `src/dados/esquema.ts` define o formato e é verificado nos testes; o zod roda só nos testes e nos scripts, não entra no bundle.

## Como o cálculo funciona

Cada programa do JSON pode ter um bloco `calculo`, escrito numa linguagem declarativa simples: requisitos da família (renda por pessoa, exigir ou excluir o Bolsa Família, ter criança até certa idade, morar no semiárido...) e a forma de pagar (um valor por família, por pessoa que atende a um filtro ou por pessoa da casa, com adicionais, valor para tempo integral e número de pagamentos no ano). O interpretador em `src/calculo/regras/interpretador.ts` transforma isso numa regra de simulação. Valores podem ser em reais ou em fração do salário mínimo (`{ "sm": 0.5 }`), e assim acompanham o reajuste sozinhos.

O BPC e o Bolsa Família ficam em código porque mudam a renda da família e outras regras dependem deles, mas os valores dos dois também estão no JSON (`referencias.json`).

O simulador:

1. Soma a renda de trabalho, aposentadorias e pensões da casa.
2. Encontra quem poderia pedir BPC: 65 anos ou mais, ou com deficiência, sem aposentadoria e dentro do limite de ¼ do salário mínimo por pessoa. O BPC ou a aposentadoria de até um salário mínimo de outro idoso ou pessoa com deficiência da casa não entra nessa conta (LOAS, art. 20, §14).
3. Monta um cenário para cada combinação de pedidos de BPC (até 6 pessoas), com e sem Bolsa Família. O cenário sem Bolsa Família existe porque alguns programas estaduais não aceitam quem recebe.
4. Em cada cenário, calcula o Bolsa Família primeiro (inclusive a Regra de Proteção) e depois aplica as regras do BPC e de todos os programas do JSON que valem para o estado.
5. Escolhe o cenário com o maior total mensal permanente e mostra as alternativas.

Benefícios pagos uma vez por ano ou por temporada entram como média mensal. Programas com status `confirmar` (previstos em lei, mas sem prova oficial de pagamento recente) aparecem no resultado sem entrar na soma.

Um caso que os testes cobrem: uma família de 10 pessoas sem renda, com um idoso e um adulto com deficiência. Pedindo BPC só para um deles, a família continua no Bolsa Família e recebe mais do que pedindo para os dois.

## Atualizando dados

Os arquivos ficam em `src/dados/`:

- `referencias.json`: salário mínimo, teto do INSS, valores e limites do Bolsa Família e do BPC, e a `dataAtualizacao` mostrada no site
- `programas.json`: a ficha de cada programa, com textos, fontes, status e o `calculo`
- `gastos.json`: gastos oficiais exibidos no site
- `locais.json`: onde pedir, telefones e aplicativos

Só entram números com fonte oficial: Planalto, Diário Oficial, páginas .gov.br de ministérios, Portal da Transparência e páginas dos governos estaduais. Quando não há confirmação de que um programa continua pagando, ele fica com status `confirmar`. Depois de editar, rode `npm test`: os testes validam todos os JSON contra o esquema.

### Incluindo um programa

Acrescente um objeto em `programas.json`. Exemplo de programa estadual que paga R$ 100 por mês, em 10 parcelas, a cada estudante do ensino médio de famílias com renda de até meio salário mínimo por pessoa:

```json
{
  "id": "xx-bolsa-estudante",
  "nome": "Bolsa Estudante XX",
  "esfera": "estadual",
  "uf": "XX",
  "categoria": "dinheiro",
  "icone": "backpack",
  "resumo": "Bolsa mensal para estudantes do ensino médio de famílias de baixa renda.",
  "valorTexto": "R$ 100 por mês",
  "paraQuem": ["Estudantes do ensino médio da rede estadual com família no CadÚnico."],
  "regras": ["Precisa de 75% de presença."],
  "comoPedir": ["É automático para alunos com família no CadÚnico."],
  "onde": ["escola", "cras"],
  "acumulaBolsaFamilia": "sim",
  "status": "ativo",
  "conferido": "2026-10-29",
  "fontes": [{ "titulo": "Lei estadual nº ...", "url": "https://www.xx.gov.br/...", "orgao": "Governo de XX" }],
  "calculo": {
    "requisitos": { "rendaPorPessoaMax": { "sm": 0.5 } },
    "tipo": "porPessoa",
    "pessoas": { "escola": ["medio"] },
    "valor": 100,
    "pagamentosPorAno": 10,
    "motivo": "Estuda no ensino médio e a família tem renda baixa."
  }
}
```

Todos os campos estão documentados em `src/dados/esquema.ts`. O `icone` é o nome de um ícone do [Bootstrap Icons](https://icons.getbootstrap.com/), sem o prefixo `bi-`. Sem o bloco `calculo`, o programa aparece no catálogo mas não entra na simulação.

## Revisão automática com IA

O workflow `.github/workflows/revisar-programas.yml` roda no dia 1 de cada mês e também pode ser disparado pela aba **Actions**, escolhendo o que revisar (tudo, só os programas, só a busca por novos, só as referências ou só os gastos) e, se quiser, limitando a alguns programas ou estados.

Para cada programa, um modelo de IA pesquisa só em domínios oficiais (`gov.br`, `leg.br`, `jus.br`), confere valores, regras e fontes e devolve a ficha corrigida com a lista de mudanças e a URL que comprova cada uma. Também procura programas novos, um estado por vez, e revisa os valores de referência e os números de gasto.

Antes de gravar qualquer coisa, `scripts/revisao/validacao.ts` confere a resposta: formato do esquema, id e estado inalterados, fonte oficial para toda mudança e para todo programa novo. Programas que o modelo não consegue confirmar viram `confirmar` e saem da soma da simulação. Respostas que não passam na validação são descartadas e listadas no relatório.

No fim, o workflow roda lint, testes e build com os dados novos. Se tudo passar, faz o commit dos JSON direto na `main` e publica o site em seguida. Se algo falhar, nada é gravado e a execução fica marcada com erro. O relatório das mudanças e das fontes vai na mensagem do commit e no resumo da execução, na aba Actions. Vale ler esse relatório depois de cada execução: como não há revisão antes de publicar, um erro da IA que passe pela validação vai direto para o site.

Configuração no GitHub, uma vez só:

1. Em **Settings > Secrets and variables > Actions**, crie o secret `ANTHROPIC_API_KEY`.
2. Em **Settings > Actions > General > Workflow permissions**, deixe **Read and write permissions**. Se a `main` tiver regra de proteção que bloqueia push direto, o commit do workflow vai falhar.

Para rodar localmente (gasta créditos da API):

```bash
export ANTHROPIC_API_KEY=...
npm run revisar -- --modo revisar --programas ms-mais-social
npm run revisar -- --modo novos --ufs CE,MA
npm run revisar -- --seco   # faz as consultas, mas não grava os JSON
```

O relatório fica em `.revisao/relatorio.md`. O modelo pode ser trocado com a variável `MODELO_REVISAO`. Uma execução completa faz algumas dezenas de consultas com pesquisa na web; o consumo de tokens e o número de buscas aparecem no fim do relatório.

## Testes

Os testes ficam ao lado do código (`*.test.ts`) e cobrem:

- o cálculo do Bolsa Família e do BPC
- a escolha do melhor cenário
- os programas estaduais que somam ou excluem o Bolsa Família
- as transformações de estado do simulador
- o interpretador das regras do JSON
- os JSON contra o esquema, e a integridade do catálogo: ids únicos, fontes em https, locais e ícones existentes
- a validação das respostas da revisão automática (fontes oficiais, ids, programas novos repetidos)

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

- Os valores valem para a data de `dataAtualizacao` em `referencias.json`. A revisão automática publica sem revisão humana prévia; confira o relatório de cada execução.
- Programas municipais não estão incluídos.
- Alguns programas estaduais estão como `confirmar` por falta de fonte oficial recente.
- O total do Bolsa Família em 2026 cobre só os meses em que o governo divulgou a folha.
- Gás do Povo e Tarifa Social aparecem sem valor em reais, porque não há fonte oficial para o preço do botijão ou da tarifa.

## Licença

[MIT](LICENSE). A licença cobre o código; leis e dados públicos citados continuam sendo dos órgãos que os publicam.
