# Direito na Mão

Guia gratuito e acessível dos programas de transferência de renda do Brasil (federais e estaduais), com simulador que calcula quais benefícios uma pessoa ou família pode receber, quanto, e onde pedir.

- **Sem servidor:** todos os dados e o cálculo ficam no próprio site. Nenhuma resposta sai do aparelho.
- **PWA:** pode ser instalado no celular e funciona sem internet depois do primeiro acesso.
- **Acessível:** letras grandes (3 tamanhos), alto contraste, leitura em voz alta (voz do aparelho), botões grandes, linguagem simples, navegação por teclado e leitor de tela (auditado com axe-core, WCAG 2 AA).
- **Fontes oficiais:** cada programa e cada número de gasto tem link para lei, decreto ou página .gov.br.

## Arquitetura

```
src/
  data/            catálogo (fonte única): programas, valores de referência, gastos, locais
  calculo/
    tipos.ts       abstrações: Pessoa, Familia, Contexto, Avaliacao, Regra
    regras/        uma regra por programa (bpc, bolsaFamilia, federais, estaduais) + aplicar
    simulador.ts   orquestra os cenários e escolhe o melhor
    dicas.ts       passo a passo do resultado
  estado/          transformações puras da simulação + hook React com persistência
  paginas/         telas (o simulador tem um componente por passo)
  componentes/     peças de interface reutilizáveis
```

Princípios seguidos:

- **Responsabilidade única:** dados, regras, orquestração, estado e telas ficam em módulos separados.
- **Aberto/fechado:** para incluir um programa, cadastre-o no catálogo e crie a regra dele (`Regra`). Programas estaduais trazem a própria função `avaliar`. O motor não precisa ser alterado.
- **Inversão de dependência:** dados e regras dependem só das abstrações em `calculo/tipos.ts`, e não do simulador concreto.
- Nome, ícone e status de cada programa vêm do catálogo (`data/catalogo.ts`), então nada fica duplicado. Os testes garantem que toda regra aponta para um programa cadastrado e que toda fonte usa https.

## Simulação e otimização

O motor (`src/calculo/simulador.ts`) testa todas as combinações de pedir ou não o BPC para cada pessoa elegível, com e sem Bolsa Família (alguns programas estaduais excluem quem recebe BF), e escolhe a que rende mais dinheiro por mês de forma permanente. Isso importa porque o BPC conta como renda no Bolsa Família: às vezes pedir um BPC a mais faz a família perder o Bolsa Família inteiro.

Programas com status `confirmar` (existem em lei, mas sem prova de pagamento recente) aparecem no resultado, mas não entram na soma.

## Dados

| Arquivo | Conteúdo |
|---|---|
| `src/data/referencias.ts` | Salário mínimo, valores e limites do Bolsa Família, BPC e Pé-de-Meia |
| `src/data/programasFederais.ts` | Programas federais: textos, como pedir e fontes (regras de cálculo em `src/calculo/regras/`) |
| `src/data/programasEstaduais.ts` | Programas estaduais com a regra de elegibilidade de cada um (`avaliar`) |
| `src/data/catalogo.ts` | Lista única de todos os programas e busca por id |
| `src/data/gastos.ts` | Gastos oficiais (Portal da Transparência, MDS, Secom, MEC, MTE) |
| `src/data/locais.ts` | Onde pedir, telefones e aplicativos |

Para atualizar valores, edite esses arquivos e a constante `DATA_ATUALIZACAO`.

## Comandos

```bash
npm install
npm run dev      # desenvolvimento
npm test         # testes do motor de cálculo
npm run build    # gera a pasta dist/ (hospedagem estática)
npm run icones   # regenera os ícones PNG a partir de public/icone.svg
```

O build usa caminhos relativos e `HashRouter`, então a pasta `dist/` funciona em qualquer hospedagem estática (GitHub Pages, Netlify, Vercel, servidor comum).

## Aviso

Este é um guia independente, não é um site do governo. O resultado é uma simulação; quem concede o benefício é o órgão responsável após análise do cadastro.
