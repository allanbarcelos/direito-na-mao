# Direito na Mão

Guia gratuito e acessível dos programas de transferência de renda do Brasil, federais e estaduais. Um simulador calcula quais benefícios uma pessoa ou família pode receber, quanto e onde pedir. Ele também mostra a combinação de benefícios que rende mais.

> **Aviso:** este é um guia independente e **não é um site do governo**. Os valores e as regras seguem leis, decretos e páginas oficiais (.gov.br) conferidos na data indicada em `src/data/referencias.ts`. O resultado é uma simulação. Quem concede o benefício é o órgão responsável, depois de analisar o cadastro.

---

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Tecnologias](#tecnologias)
3. [Requisitos e instalação](#requisitos-e-instalação)
4. [Comandos](#comandos)
5. [Estrutura de pastas](#estrutura-de-pastas)
6. [Arquitetura](#arquitetura)
7. [Como funciona a simulação](#como-funciona-a-simulação)
8. [Dados e fontes oficiais](#dados-e-fontes-oficiais)
9. [Como atualizar valores](#como-atualizar-valores)
10. [Como incluir um programa](#como-incluir-um-programa)
11. [Acessibilidade](#acessibilidade)
12. [PWA e funcionamento offline](#pwa-e-funcionamento-offline)
13. [Privacidade](#privacidade)
14. [Testes e qualidade](#testes-e-qualidade)
15. [Deploy no GitHub Pages](#deploy-no-github-pages)
16. [Convenções do projeto](#convenções-do-projeto)
17. [Problemas comuns](#problemas-comuns)
18. [Limitações conhecidas](#limitações-conhecidas)
19. [Licença](#licença)

---

## Funcionalidades

| Tela | O que faz |
|---|---|
| **Início** | Apresentação em linguagem simples. Destaca o gasto federal com assistência social, os valores principais e o primeiro passo (CadÚnico). Tem um alerta contra golpes. |
| **Simular** | Questionário passo a passo para uma pessoa ou para a família: estado, número de pessoas, perguntas sobre cada pessoa e perguntas sobre a família. As respostas ficam salvas no aparelho. |
| **Resultado** | Total por mês e por ano, cada benefício com o motivo e os avisos, um passo a passo do que fazer, onde ir e a comparação entre combinações. Programas "a confirmar" aparecem à parte. Tem botões para ouvir e imprimir. |
| **Programas** | Catálogo com busca e filtro por estado. Cada programa tem uma página de detalhe com quem pode receber, regras, como pedir, onde ir e fontes oficiais. |
| **Onde pedir** | CRAS e documentos necessários, telefones gratuitos (121, 135, 111, 158), aplicativos oficiais e lugares de atendimento. |
| **Gastos** | Números oficiais de gasto: assistência social, Bolsa Família por mês e por ano, Pé-de-Meia, Seguro-Defeso. Gráfico de barras acompanhado de tabela acessível. |
| **Sobre / Fontes** | Aviso de que o site não é oficial, privacidade, como o cálculo funciona e a lista de todas as fontes. A rota `#/fontes` abre direto na lista. |

Em todas as telas há uma faixa no topo informando que o site não é oficial, com link para as fontes.

---

## Tecnologias

| Uso | Ferramenta |
|---|---|
| Interface | React 19 + TypeScript 7 |
| Build e servidor de desenvolvimento | Vite 8 |
| Rotas | React Router 7 (`HashRouter`) |
| PWA (manifesto e service worker) | vite-plugin-pwa (Workbox) |
| Testes | Vitest |
| Lint | oxlint |
| Fonte | Atkinson Hyperlegible (via `@fontsource`, embutida no build) |
| Ícones do app | `sharp`, que gera os PNG a partir do SVG |

Não há backend nem banco de dados. Todo o conteúdo está no código e o cálculo roda no navegador.

---

## Requisitos e instalação

- **Node.js 24** (a mesma versão usada no deploy)
- **npm 11** ou superior
- Git

```bash
git clone <url-do-repositorio> direito-na-mao
cd direito-na-mao
npm install
npm run dev
```

O servidor de desenvolvimento abre em `http://localhost:5173`.

---

## Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Checagem de tipos (`tsc -b`) e build de produção em `dist/` |
| `npm run preview` | Serve a pasta `dist/` localmente (`http://localhost:4173`), com service worker ativo |
| `npm test` | Roda os testes (Vitest) |
| `npm run lint` | Roda o oxlint |
| `npm run icones` | Gera `icone-192.png`, `icone-512.png` e `apple-touch-icon.png` a partir de `public/icone.svg` |

---

## Estrutura de pastas

```
direito-na-mao/
├── .github/workflows/deploy.yml   # CI: lint, testes, build e publicação no GitHub Pages
├── public/                        # ícones do app (SVG e PNG)
├── scripts/gerar-icones.mjs       # gera os PNG dos ícones
├── index.html
├── vite.config.ts                 # Vite + configuração do PWA (manifesto, cache)
└── src/
    ├── main.tsx                   # ponto de entrada, fonte e registro do service worker
    ├── App.tsx                    # rotas
    ├── config.ts                  # nome e slogan do site
    ├── index.css                  # tokens de cor, temas, alto contraste, tamanhos de letra
    ├── data/                      # catálogo e dados oficiais (fonte única de verdade)
    │   ├── tipos.ts               # Programa, Fonte, Local, UF...
    │   ├── referencias.ts         # salário mínimo, valores do Bolsa Família, BPC, Pé-de-Meia
    │   ├── programasFederais.ts   # textos, regras em linguagem simples, fontes
    │   ├── programasEstaduais.ts  # idem + função avaliar() de cada programa
    │   ├── catalogo.ts            # lista única de programas e busca por id
    │   ├── gastos.ts              # gastos oficiais com fonte
    │   └── locais.ts              # onde pedir, telefones, aplicativos
    ├── calculo/                   # regras de negócio (sem React)
    │   ├── tipos.ts               # Pessoa, Familia, Contexto, Avaliacao, Regra, Cenario
    │   ├── regras/
    │   │   ├── aplicar.ts         # junta o resultado das regras com o catálogo
    │   │   ├── bpc.ts             # elegibilidade e regra do BPC
    │   │   ├── bolsaFamilia.ts    # cálculo do Bolsa Família e Regra de Proteção
    │   │   ├── federais.ts        # demais regras federais
    │   │   ├── estaduais.ts       # regras do estado escolhido
    │   │   └── comum.ts           # utilidades compartilhadas
    │   ├── simulador.ts           # monta e compara cenários, escolhe o melhor
    │   └── dicas.ts               # passo a passo do resultado
    ├── estado/
    │   ├── simulacao.ts           # transformações puras + persistência
    │   └── useSimulacao.ts        # hook React
    ├── componentes/               # Layout, AvisoOficial, Acessibilidade, Ouvir, Perguntas...
    ├── paginas/                   # Inicio, Resultado, Programas, OndePedir, Gastos, Sobre
    │   └── simulador/             # Simulador (orquestrador) + um componente por passo
    └── lib/                       # formatação, armazenamento local, leitura em voz alta
```

---

## Arquitetura

As dependências vão sempre na mesma direção:

```
paginas / componentes  →  estado  →  calculo  →  data
                                        ↘          ↗
                                     calculo/tipos.ts (abstrações)
```

Princípios adotados:

- **Responsabilidade única.** Dados, regras de cálculo, orquestração dos cenários, estado da interface e telas ficam em módulos separados. O simulador tem um componente para cada passo.
- **Aberto/fechado.** Cada programa é uma `Regra` (`programaId` + `avaliar(ctx)`). Incluir um programa não exige mudar o motor.
- **Inversão de dependência.** Dados e regras dependem só das abstrações em `calculo/tipos.ts`, nunca do `simulador.ts`.
- **Fonte única.** Nome, ícone, status e fontes de cada programa vêm do catálogo (`data/catalogo.ts`). As regras devolvem apenas valores e motivos.
- **Funções puras.** O cálculo e as transformações de estado não dependem de React, o que facilita os testes.

### Tipos principais

| Tipo | Onde | Papel |
|---|---|---|
| `Programa` | `data/tipos.ts` | Ficha do programa: textos, valor, categoria, status (`ativo` ou `confirmar`), se acumula com o Bolsa Família, fontes |
| `Pessoa` / `Familia` | `calculo/tipos.ts` | Respostas do questionário |
| `Contexto` | `calculo/tipos.ts` | Dados de um cenário: renda familiar e por pessoa, valor do Bolsa Família, quem pede BPC |
| `Avaliacao` | `calculo/tipos.ts` | O que uma regra devolve: valor mensal, texto, motivo, avisos, frequência, prazo |
| `Regra` | `calculo/tipos.ts` | `{ programaId, avaliar(ctx): Avaliacao[] }` |
| `Cenario` / `Resultado` | `calculo/tipos.ts` | Benefícios de uma combinação, totais e o resultado final |

---

## Como funciona a simulação

1. **Renda base.** Soma a renda de trabalho e as aposentadorias e pensões de todos da casa.
2. **Candidatos ao BPC.** Entram as pessoas com 65 anos ou mais, ou com deficiência, que não têm aposentadoria e passam no teste de renda de ¼ do salário mínimo por pessoa. Nesse teste, o BPC ou a aposentadoria de até 1 salário mínimo de outro idoso ou pessoa com deficiência da casa não conta (LOAS, art. 20 §14).
3. **Cenários.** Para cada subconjunto de candidatos ao BPC (até 6 pessoas, ou seja, até 64 combinações), monta dois cenários: um tentando o Bolsa Família e outro sem ele. O cenário sem Bolsa Família existe porque alguns programas estaduais excluem quem recebe.
4. **Em cada cenário:**
   - a renda familiar inclui os BPCs do cenário, porque o BPC conta como renda no Bolsa Família;
   - o Bolsa Família é calculado primeiro: entrada até R$ 218 por pessoa ou Regra de Proteção, com 50% do valor para quem já recebe e tem renda de até R$ 706 por pessoa;
   - em seguida são aplicadas a regra do BPC, as regras federais e as regras do estado;
   - programas com status `confirmar` ficam fora da soma.
5. **Escolha.** Os cenários são ordenados pelo total mensal **permanente**, sem benefícios temporários. O desempate é pelo total com os temporários. Cenários com exatamente os mesmos benefícios contam uma vez só.
6. **Saída.** O melhor cenário, até 3 alternativas, os programas "a confirmar" do estado e um passo a passo (`dicas.ts`).

Benefícios anuais ou sazonais (Pé-de-Meia, Garantia-Safra, Seguro-Defeso, bolsas estaduais pagas em 10 meses) entram na soma como **média mensal**. Benefícios em produto ou desconto (Gás do Povo, Tarifa Social) aparecem sem valor em reais.

### Exemplo validado nos testes

Família de 10 pessoas sem renda: casal com a mãe gestante, 3 crianças de 0 a 6 anos, 3 jovens de 7 a 17 anos (2 no ensino médio), 1 idoso e 1 adulto com deficiência.

- Com **1 BPC**, a renda fica em R$ 162,10 por pessoa e a família recebe o Bolsa Família cheio:
  - BPC: R$ 1.621
  - Bolsa Família: R$ 2.391
  - Pé-de-Meia: R$ 500
  - Total: **R$ 4.512 por mês**
- Com **2 BPCs**, a renda passa de R$ 218 por pessoa e a família perde o Bolsa Família. Por isso o simulador recomenda 1 BPC.
- No Mato Grosso do Sul, soma-se o Mais Social (R$ 450), chegando a **R$ 4.962 por mês**.

---

## Dados e fontes oficiais

Todos os números estão em `src/data/` e cada um tem uma `Fonte` (título, URL, órgão e data). As fontes aceitas são:

- leis e decretos no site do Planalto (`planalto.gov.br`) e no Diário Oficial;
- páginas `.gov.br` dos ministérios (MDS, MEC, MTE, MDA, MMA, MME, INSS), da Secom e do Portal da Transparência (CGU);
- páginas oficiais dos governos estaduais.

| Arquivo | Conteúdo |
|---|---|
| `referencias.ts` | `DATA_ATUALIZACAO`, salário mínimo, valores e limites do Bolsa Família, BPC, Pé-de-Meia |
| `programasFederais.ts` | 15 programas federais (assistenciais, trabalhistas, em produto e desconto) |
| `programasEstaduais.ts` | Programas estaduais com a função `avaliar` de cada um, e `ESTADOS_SEM_PROGRAMA` |
| `gastos.ts` | Destaques de gasto e a folha mensal do Bolsa Família |
| `locais.ts` | CRAS, INSS, Caixa, escola, colônia de pescadores, telefones e aplicativos |

**Status dos programas:**
- `ativo`: confirmado em fonte oficial com pagamento recente. Entra na soma.
- `confirmar`: existe em lei, mas não há prova de pagamento recente. Aparece no resultado, fora da soma, com aviso.

**Acúmulo com o Bolsa Família** (`acumulaBolsaFamilia`):
- `sim`: pode somar com o Bolsa Família.
- `nao`: o simulador só considera o programa nos cenários sem Bolsa Família.
- `incerto`: aparece um aviso no resultado.

---

## Como atualizar valores

1. Confira o novo valor em fonte oficial.
2. Edite o valor:
   - constantes nacionais em `src/data/referencias.ts`;
   - textos e regras de cada programa em `programasFederais.ts` ou `programasEstaduais.ts`;
   - números de gasto em `gastos.ts`.
3. Adicione ou atualize a `Fonte` correspondente, com a data.
4. Atualize `DATA_ATUALIZACAO` em `referencias.ts`. Ela aparece no aviso do topo, no rodapé e nas páginas de programa.
5. Se a mudança afetar o cálculo, ajuste os valores esperados em `src/calculo/simulador.test.ts`.
6. Rode `npm test` e `npm run build`.

---

## Como incluir um programa

### Programa estadual

Adicione um objeto em `PROGRAMAS_ESTADUAIS` (`src/data/programasEstaduais.ts`) com a ficha completa e a função `avaliar`:

```ts
{
  id: 'xx-meu-programa', uf: 'XX', nome: 'Meu Programa', esfera: 'estadual',
  categoria: 'dinheiro', icone: '💳',
  resumo: 'Frase curta em linguagem simples.',
  valorTexto: 'R$ 100 por mês',
  paraQuem: ['...'], regras: ['...'], comoPedir: ['...'],
  onde: ['cras', 'estado'], acumulaBolsaFamilia: 'sim', status: 'ativo', conferido: C,
  fontes: [{ titulo: '...', url: 'https://...gov.br/...', orgao: 'Governo de XX' }],
  avaliar: (ctx) => ctx.rendaPorPessoa <= 218
    ? [{ valorMensal: 100, valorTexto: 'R$ 100 por mês', motivo: 'Renda baixa.' }]
    : [],
},
```

Não é preciso mexer em mais nada: `regrasDoEstado` registra o programa automaticamente.

### Programa federal

1. Adicione a ficha em `PROGRAMAS_FEDERAIS` (`src/data/programasFederais.ts`).
2. Crie a `Regra` em `src/calculo/regras/federais.ts` e inclua-a em `REGRAS_FEDERAIS`.

Se o programa **altera a renda da família** (como o BPC) ou é usado por outras regras (como o Bolsa Família), ele precisa ser tratado em `simulador.ts`.

Os testes em `regras.test.ts` falham se uma regra apontar para um programa que não está no catálogo, ou se alguma fonte não usar `https`.

---

## Acessibilidade

O público inclui pessoas sem familiaridade com tecnologia e com dificuldade de leitura. Por isso:

- **Linguagem simples:** frases curtas, sem siglas soltas, valores sempre em reais.
- **Letra ajustável:** botões A− e A+ no topo, com 3 tamanhos (`data-fonte` no `<html>`). A preferência fica salva.
- **Alto contraste:** tema preto e amarelo (`data-contraste="alto"`), além de tema escuro automático.
- **Leitura em voz alta:** botões "Ouvir" em perguntas, resultados e páginas, usando a voz do próprio aparelho (Web Speech API, pt-BR). O texto é preparado para leitura: "R$ 1.621" vira "1621 reais", e siglas são soletradas.
- **Botões grandes:** alvos de toque de 44 a 72 px. Respostas Sim/Não em botões, sem caixas pequenas de marcar.
- **Fonte legível:** Atkinson Hyperlegible, criada para pessoas com baixa visão.
- **Teclado e leitor de tela:** link "Pular para o conteúdo", foco visível, foco levado ao conteúdo ao trocar de página, `aria-pressed` nas opções, `role="progressbar"` no andamento e tabelas roláveis que recebem foco.
- **Gráficos:** o gráfico de barras tem tabela equivalente, e cada barra traz o valor por escrito.
- **Movimento reduzido:** transições desligadas com `prefers-reduced-motion`.
- **Impressão:** o resultado sai limpo no papel, para levar ao CRAS.

As páginas foram auditadas com **axe-core** (regras WCAG 2 A e AA) em 390 px de largura, sem violações e sem rolagem horizontal.

---

## PWA e funcionamento offline

- O manifesto e o service worker são gerados pelo `vite-plugin-pwa` (configuração em `vite.config.ts`).
- Todos os arquivos (JS, CSS, HTML, fontes e ícones) são guardados no primeiro acesso, e o site funciona sem internet depois disso.
- `registerType: 'autoUpdate'`: uma versão nova é instalada sozinha.
- O botão "Instalar no celular" aparece quando o navegador permite (evento `beforeinstallprompt`).
- O build usa `base: './'` e `HashRouter`, então funciona em qualquer pasta ou subdomínio, sem configurar o servidor.

---

## Privacidade

- Nenhuma resposta é enviada para servidor algum: não há backend, analytics ou cookies.
- As respostas e as preferências de leitura ficam no `localStorage` do aparelho. O acesso é protegido com `try/catch`, então em navegação privada o site funciona sem salvar.
- O botão "Começar do zero" apaga a simulação salva.

---

## Testes e qualidade

```bash
npm test         # Vitest
npm run lint     # oxlint
npm run build    # inclui checagem de tipos (tsc -b)
```

| Arquivo | O que cobre |
|---|---|
| `src/calculo/simulador.test.ts` | Cálculo do Bolsa Família (mínimo, adicionais, linha de entrada, Regra de Proteção), BPC (§14 da LOAS, aposentadoria), otimização com família grande, programa estadual compatível, comparação com programas que excluem o Bolsa Família, Seguro-Defeso, programas "a confirmar" |
| `src/calculo/regras/regras.test.ts` | Integridade do catálogo (ids únicos, fontes https), toda regra aponta para um programa cadastrado, inclusão de regra nova sem alterar o motor |
| `src/estado/simulacao.test.ts` | Transformações de estado: modo, quantidade de pessoas, imutabilidade |

O workflow de deploy roda lint, testes e build antes de publicar. Se algum falhar, o site não é atualizado.

---

## Deploy no GitHub Pages

O workflow `.github/workflows/deploy.yml` roda a cada push na `main` e também pode ser disparado manualmente pela aba **Actions**. Ele tem duas etapas:

1. **build:** `npm ci`, lint, testes, build e upload da pasta `dist/` como artefato do Pages;
2. **deploy:** publicação com `actions/deploy-pages`.

Configuração (uma vez só):

1. Envie o repositório para o GitHub:
   ```bash
   git remote add origin https://github.com/<usuario>/direito-na-mao.git
   git push -u origin main
   ```
2. No GitHub, abra **Settings → Pages → Build and deployment → Source** e escolha **GitHub Actions**.

O site fica em `https://<usuario>.github.io/<repositorio>/`. A pasta `dist/` também pode ser publicada em qualquer hospedagem estática (Netlify, Vercel, servidor Apache ou Nginx).

---

## Convenções do projeto

- **Idioma:** código, comentários, nomes e mensagens de commit em português. O público e os dados são brasileiros.
- **Estilo:** TypeScript estrito, componentes funcionais, funções puras no cálculo. Comentários curtos explicando o *porquê*.
- **Commits:** frequentes e descritivos, no imperativo (ex.: "Adiciona workflow de deploy no GitHub Pages").
- **Dados:** nenhum número sem fonte oficial. Na dúvida, o programa fica com status `confirmar`.
- **Renomear o site:** altere `NOME_SITE` em `src/config.ts`, o manifesto em `vite.config.ts` e o `<title>` em `index.html`.

---

## Problemas comuns

**`npm install` falha com `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.** A rede usa um proxy que inspeciona HTTPS (comum em redes corporativas). Use os certificados do sistema:

```bash
# Bash
NODE_OPTIONS=--use-system-ca npm install
```

```powershell
# PowerShell
$env:NODE_OPTIONS='--use-system-ca'; npm install
```

**A tela fica com a versão antiga depois do deploy.** O service worker atualiza na próxima abertura. Para forçar, feche todas as abas do site e abra de novo, ou limpe os dados do site no navegador.

**A leitura em voz alta não aparece.** O botão só é exibido quando o navegador oferece síntese de voz. Em alguns aparelhos é preciso instalar a voz em português nas configurações do sistema.

---

## Limitações conhecidas

- Os valores são os vigentes na data de `DATA_ATUALIZACAO`. Mudanças posteriores exigem atualização manual.
- Alguns programas estaduais estão como `confirmar`, por falta de prova oficial de pagamento recente.
- Programas municipais não estão incluídos.
- O total do Bolsa Família em 2026 cobre apenas os meses em que o governo divulgou a folha (janeiro a junho).
- O Gás do Povo e a Tarifa Social aparecem sem valor em reais, porque não há fonte oficial para o preço do botijão ou da tarifa.
- A simulação usa as informações declaradas. A concessão real depende de análise do órgão responsável (CadÚnico, perícia do INSS, vagas dos programas estaduais).

---

## Licença

Distribuído sob a licença [MIT](LICENSE). © 2026 Allan Barcelos.

A licença vale para o código. Leis, decretos e dados públicos citados pertencem aos respectivos órgãos e continuam sendo de domínio público.
