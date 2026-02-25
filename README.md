# 🏦 Konta API - Nexor Startup

> **O motor financeiro de alta performance por trás do aplicativo Konta.** > Uma API RESTful focada em Segurança Ofensiva (Red Team), *Clean Architecture* e *Domain-Driven Design (DDD)*.

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=Sequelize&logoColor=white)
![Security](https://img.shields.io/badge/Security-OWASP_Top_10-red?style=for-the-badge)

## 📖 Sobre o Projeto

O backend do aplicativo Konta não foi construído apenas para "fazer funcionar". Ele foi desenhado para ser um ecossistema **Production-Ready**, escalável e em conformidade com as exigências da Play Store e Apple Store. 

O sistema lida com o processamento de dupla entrada para gestão patrimonial, incluindo gastos, receitas, controle de faturas de cartão de crédito, investimentos e financiamentos, servindo como a fundação de dados para uma futura integração com Inteligência Artificial.

## 🏗️ Decisões Arquiteturais e Segurança

A arquitetura afasta-se do acoplamento tradicional (Spaghetti Code) e adota um design defensivo rigoroso:

* **Strict Whitelisting & Mass Assignment Prevention:** Controladores "burros" e validadores estritos (`express-validator`). O sistema desintegra silenciosamente qualquer payload malicioso não mapeado nos contratos da API.
* **Mitigação de IDOR (Insecure Direct Object Reference):** A API não confia em parâmetros de URL para ações sensíveis. A identidade e a autorização são extraídas cirurgicamente do payload criptografado do Token JWT (*Single Source of Truth*).
* **Token Rotation (OAuth 2.0 Patterns):** Implementação de *Access Tokens* efêmeros (15 minutos, Stateless) e *Refresh Tokens* opacos, armazenados no banco de dados e revogáveis, garantindo controle total de sessão e mitigação de roubos de credenciais.
* **Conformidade LGPD & Soft Delete Paranoico:** Exclusões de contas preservam a integridade relacional do histórico financeiro usando *Soft Deletes* do Sequelize, acompanhados de um Mascaramento Destrutivo de PII (E-mail) para garantir o Direito ao Esquecimento.
* **Atomicidade (ACID):** Operações financeiras complexas rodam sob estrito controle de transações (Rollbacks automáticos), prevenindo condições de corrida e "Silent Failures".

## 📦 Estrutura de Domínios (Modules)

O projeto segue a divisão por domínios, isolando regras de negócios da infraestrutura de rede:

* `💳 /cartoes` - Gestão de faturas e lançamentos em cartões de crédito.
* `🏷️ /categorias` - Classificação customizável de despesas e receitas.
* `📊 /dashboard` - Orquestração de métricas e totalizadores financeiros.
* `🏠 /financiamento` - Motor de cálculo e amortização de parcelas longas.
* `💸 /gastos` & `gastos_fixos` - Núcleo de despesas dinâmicas e recorrentes.
* `📈 /investimentos` - Acompanhamento de portfólio e rendimentos.
* `🛒 /mercado` - Controle de listas e gastos em supermercados.
* `👤 /usuario` - Identidade, *Data Transfer Objects (DTOs)* e autenticação.

## 🚀 Como Executar Localmente

### Pré-requisitos
* Node.js (v18+)
* Banco de Dados MySQL ou MariaDB

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/backendgestaogastos.git](https://github.com/seu-usuario/backendgestaogastos.git)
