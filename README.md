# ATOMEX AI — Hermes Midnight Madness Pro

[![ATOMEX AI](https://img.shields.io/badge/ATOMEX_AI-Hermes_v5.0-7c5fe0?style=for-the-badge)](https://github.com/adkbot/ATOMEX)
[![TDD Testing](https://img.shields.io/badge/TDD_Auditing-Passed_23/23-0ecb81?style=for-the-badge)](test/run_tests.html)
[![Strategy](https://img.shields.io/badge/Strategy-Midnight_Madness-ff8c00?style=for-the-badge)](js/midnight.js)

O **ATOMEX AI** é uma plataforma modular de trading quantitativo e simulação em tempo real de derivativos, equipada com o Super-Agente IA **Hermes**. O sistema é especializado na execução automatizada e monitoramento da estratégia institucional **"Midnight Madness"** — focada no rastreamento e reversão de extremos de liquidez de mercado durante a sessão overnight.

---

## 🌙 A Estratégia "Midnight Madness Pro"

O motor algorítmico do ATOMEX monitora continuamente as zonas de suporte e resistência em timeframes **H1** na janela operacional das **16:00 às 09:30 EST** (sessão overnight americana).

1. **Mapeamento de Liquidez**: Identificação automática de pivôs (5 velas de tolerância à esquerda e à direita) para mapear o **Topo 1** (Resistência) e o **Fundo 1** (Suporte).
2. **Gatilhos e Exaustão**:
   - **LONG (Compra)**: Toque abaixo do Fundo 1 + exaustão de 3 velas vermelhas consecutivas + fechamento da vela atual verde (Confirmação Pitchfork).
   - **SHORT (Venda)**: Toque acima do Topo 1 + exaustão de 3 velas verdes consecutivas + fechamento da vela atual vermelha.
3. **Gestão de Risco & Fail-Safes**:
   - Proporção Risco/Retorno (RR) fixa de **1:3**.
   - Margens de segurança de **5 ticks (offset)** no Stop Loss.
   - Cancelamento automático se o preço atingir o nível do Stop antes da ativação do gatilho.
   - Limitação rígida de **1 operação ativa por ativo**.

---

## 🏛️ Arquitetura do Projeto (SRP)

Seguindo o princípio de responsabilidade única (Single Responsibility Principle) e limites rígidos de complexidade, o projeto foi auditado e dividido em módulos pequenos e explicativos com menos de 200 linhas de código por arquivo:

```
ATOMEX/
├── index.html              # Layout semântico otimizado para SEO e livre de bloqueios CORS
├── README.md               # Documentação oficial do projeto
├── css/
│   ├── base.css            # Definições de variáveis globais, resets e animações keyframes
│   ├── layout.css          # Estruturas grids do painel, topbar, sidebars e frames de conteúdo
│   └── components.css      # Estilização de modais, inputs, tabelas, badges e toasters
├── js/
│   ├── state.js            # Estado reativo do Bot (APP, AI, MM) e sincronização com LocalStorage
│   ├── utils.js            # Utilitários de tempo, formatação matemática (f2, fu, fmt) e logs
│   ├── candles.js          # Gráfico de velas em Canvas, crosshair e loop de ticks de mercado
│   ├── midnight.js         # Lógica da sessão overnight e análise de reversão de liquidez
│   ├── ai.js               # Agente Hermes, banco de memórias, aprendizado de padrões e classificação
│   ├── order.js            # Validação financeira, margem, alavancagem e execução de ordens
│   ├── ui.js               # Renderizadores HTML de listas, tabelas e interface de configurações
│   └── app.js              # Bootstrapper principal de inicialização e DOM listeners
└── test/
    ├── run_tests.html      # Executor visual e relatório de testes direto no navegador
    └── run_tests.js        # Executor automatizado de testes unitários para CLI (Node.js)
```

---

## 🧪 Estrutura de Prova Real (TDD)

A plataforma conta com um sistema de testes unitários integrado para garantir que nenhuma refatoração quebre regras matemáticas e lógicas centrais.

### Executar os testes via terminal (Node.js):
```bash
node test/run_tests.js
```

### Executar os testes visualmente no navegador:
1. Navegue até a pasta `test/`.
2. Dê dois cliques em `run_tests.html` para abrir o painel reativo de status.

---

## 🚀 Como Rodar o Projeto Localmente

O **ATOMEX AI** foi desenvolvido utilizando tecnologias puras da Web (HTML5, Vanilla CSS e Javascript ES6) integradas ao **Chart.js** via CDN. Ele pode ser executado sem a necessidade de servidores web complexos:

1. Clone o repositório ou baixe a pasta do projeto.
2. Dê dois cliques no arquivo [index.html](index.html) para abri-lo diretamente no seu navegador padrão.
3. Configure suas chaves da Exchange e a chave da API da IA (OpenRouter) clicando no ícone de engrenagem (**⚙**) no canto superior direito para ativar o processador autônomo **Hermes**.
