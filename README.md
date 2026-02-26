# 🏦 Konta API · Nexor Core Engine

> **Core Banking Engine proprietário da startup Konta**, responsável por orquestrar identidade, ledger financeiro de dupla entrada, crédito, investimentos e integração com mercado financeiro para evolução orientada por IA.
>
> **Author:** Rafael Amaro Lopes *(Founder / Tech Lead)*

![Node.js](https://img.shields.io/badge/Node.js-18%2B-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-API%20Layer-111111?style=for-the-badge&logo=express&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)
![Security](https://img.shields.io/badge/Security-Red%20Team%20Mindset-B22222?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-6A0DAD?style=for-the-badge)

---

## ⚖️ Aviso Legal (IP / Copyright)

> **SOFTWARE PROPRIETÁRIO — USO RESTRITO.**
>
> Copyright © 2025 **Rafael Amaro Lopes**. Todos os direitos reservados.
>
> Este repositório **não é open source**. Nenhuma parte deste código pode ser usada, copiada, modificada, distribuída, sublicenciada, publicada ou incorporada em outros sistemas sem **licença comercial prévia e expressa por escrito** do titular.

---

## 🌐 Sobre a Plataforma

A **Konta API - Nexor Core Engine** é o backend estratégico do aplicativo Konta e opera como um motor financeiro corporativo para **gestão patrimonial (Wealth Management)**.

A plataforma foi desenhada para ambientes críticos de negócio, com foco em:

- Processamento transacional confiável para finanças pessoais e empresariais.
- Regras financeiras robustas (dupla entrada, crédito, fechamento de faturas e amortização).
- Integração com mercado financeiro (ativos tradicionais e criptoativos).
- Base de dados consistente e pronta para trilhas avançadas de **Inteligência Artificial**.

Em termos executivos, este backend não é um “CRUD de apoio”; é um **núcleo financeiro transacional**, orientado para segurança, rastreabilidade e evolução de produto em escala.

---

## 🛡️ Engenharia e Segurança

A engenharia do projeto segue princípios de arquitetura corporativa com separação estrita de responsabilidades e defesa em profundidade.

### 1) Clean Architecture + Domain-Driven Design (DDD)

- O domínio financeiro é tratado como centro do sistema.
- Camadas de rede e persistência ficam desacopladas das regras de negócio.
- Evolução de funcionalidades com menor risco de regressão e menor acoplamento estrutural.

### 2) Segurança Ofensiva (Red Team Mindset)

- **Strict Whitelisting** em entrada de dados.
- Mitigação explícita de **Mass Assignment / Over-posting**.
- Payloads mascarados, campos inesperados e tentativas de escalonamento de privilégio são neutralizados por contrato.

### 3) Zero-Trust Identity (Mitigação de IDOR)

- A API não confia cegamente em IDs vindos de URL para decisões sensíveis.
- Identidade e contexto de autorização derivam de **claims criptografados no JWT**.
- Redução drástica de risco de acesso indevido entre contas.

### 4) Sessão de Alta Segurança (OAuth 2.0-like)

- **Access Token efêmero (stateless)** para chamadas de baixa latência.
- **Refresh Token opaco, persistido e revogável** no banco de dados.
- Fluxo resiliente a roubo de sessão, com rotação/revogação controlada.

### 5) Governança de Dados (LGPD by Design)

- Estratégia de **Soft Delete paranoico** para preservar integridade referencial.
- **Data Masking destrutivo de PII** para suportar direito ao esquecimento.
- Preservação de consistncia transacional sem sacrificar compliance.

---

## 🧩 Ecossistema de Domínios

Estrutura modular orientada a domínio:

- 👤 **`/usuario`**: Identidade, autenticação, DTOs e ciclo de sessão segura.
- 💸 **`/gastos`** & **`/gastos_fixos`**: Núcleo transacional de despesas, dupla entrada e recorrência.
- 💳 **`/cartoes`**: Motor de faturas, limites e fechamento de cartão de crédito.
- 🏠 **`/financiamento`**: Motor matemático para amortização e juros de longo prazo.
- 📈 **`/investimentos`**: Gestão de carteira e alocação patrimonial.
- 📊 **`/mercado`**: Integrações e monitoramento de operações de mercado (B3, criptoativos etc.).
- 🏷️ **`/categorias`**: Classificação de dados para inteligência analítica e IA.
- 📉 **`/dashboard`**: Consolidação de indicadores e totalizadores executivos.

---

## 🧪 Setup para Desenvolvedores Autorizados

> Acesso permitido apenas para equipe interna e parceiros com autorização formal.

### Pré-requisitos

- Node.js 18+
- MySQL ou MariaDB
- npm

### 1) Clonar o repositório

```bash
git clone <URL_PRIVADA_DO_REPOSITORIO>
cd backEndGestaoGastos
```

### 2) Instalar dependências

```bash
npm install
```

### 3) Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz com as credenciais de banco e segredos de autenticação.

Exemplo mínimo:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=<database>
DB_USER=<user>
DB_PASSWORD=<password>
JWT_SECRET=<chave_forte_e_privada>
```

### 4) Executar migrações

```bash
npx sequelize-cli db:migrate
```

### 5) Subir ambiente de desenvolvimento

```bash
npm run dev
```

---

## 📌 Nota de Posicionamento Técnico

Este repositório representa um ativo estratégico de engenharia: um motor financeiro orientado a segurança, coerência de domínio e escalabilidade de produto. Seu objetivo é sustentar operações críticas com padrões de software corporativo, e não um template genérico de API.
