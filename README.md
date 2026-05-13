# ⬡ Finance Control System

<div align="center">

![Finance Control System](https://img.shields.io/badge/Finance%20Control-System-00f5ff?style=for-the-badge&labelColor=0d0d0d)
![Status](https://img.shields.io/badge/status-online-00ff88?style=for-the-badge&labelColor=0d0d0d)
![Jest](https://img.shields.io/badge/testes-42%20passed-ffd700?style=for-the-badge&labelColor=0d0d0d)

**Sistema de controle de gastos pessoais com autenticação e dados na nuvem.**

[🌐 Acessar o Sistema](https://kyon-s2.github.io/BootCampII-Intermediaria/)

</div>

---

## 📌 Sobre o Projeto

O **Finance Control System** é uma conversão do projeto incial que era CLI em python, e foi convertido para GUI em HTML, CSS e JavaScript, com o uso do Claude Code.

## ✨ Funcionalidades

- 🔐 **Autenticação** — cadastro e login com e-mail e senha
- ➕ **Cadastro de Gastos** — nome, valor, categoria e data
- ✕ **Remoção de Gastos** — com confirmação antes de excluir
- 📊 **Relatório** — tabela completa com total acumulado
- 📈 **Dashboard** — total acumulado, quantidade e maior gasto
- 💾 **Dados na nuvem** — persistência real via Supabase (PostgreSQL)
- 🔒 **Isolamento por usuário** — Row Level Security (RLS) no banco

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Testes | Jest |
| CI/CD | GitHub Actions |
| Deploy | GitHub Pages |

---

## 🚀 Como Rodar Localmente

**Pré-requisitos:** Node.js instalado, VS Code com extensão Live Server e uma conta no [Supabase](https://supabase.com)

```bash
# 1. Clone o repositório
git clone https://github.com/kyon-s2/BootCampII-Intermediaria.git
cd BootCampII-Intermediaria

# 2. Instale as dependências
npm install

# 3. Configure as credenciais
# Nesse projeto, coloquei a url do supabase e a anon key no próprio app.js por necessidade, mas pode ser criado um arquivo (config.js, por exemplo) e nele adicionar as keys e só fazer a integração com o js, por meio de variáveis.

# 4. Abra o index.html com o Live Server no VS Code

# Adicional 
#> ⚠️ O arquivo `config.js` não deve ser mandado para repositório por segurança — ele contém as credenciais do Supabase e está listado no `.gitignore`. Use o `config.example.js` como modelo.
```

---

## ⚙️ Configuração do Supabase

**1. Crie a tabela no SQL Editor:**

```sql
CREATE TABLE gastos (
  id        BIGSERIAL PRIMARY KEY,
  nome      TEXT      NOT NULL,
  valor     NUMERIC   NOT NULL,
  classe    TEXT      NOT NULL,
  data      TEXT      NOT NULL,
  user_id   UUID      REFERENCES auth.users(id),
  criado_em TIMESTAMP DEFAULT NOW()
);
```

**2. Configure as policies (RLS):**

```sql
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_proprio" ON gastos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_proprio" ON gastos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_proprio" ON gastos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

**3. Trigger para preencher user_id automaticamente:**

```sql
CREATE OR REPLACE FUNCTION preencher_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_user_id
  BEFORE INSERT ON gastos
  FOR EACH ROW EXECUTE FUNCTION preencher_user_id();
```

---

## 🧪 Testes

O projeto possui **42 testes automatizados** cobrindo:

- Validação de valor, nome, classe e data
- Validação de e-mail, senha e confirmação de senha
- Cálculo de total e maior gasto
- Remoção de gastos por ID
- Formatação de valores em real brasileiro

```bash
npm test
```

A pipeline de CI roda automaticamente a cada push via **GitHub Actions**.

---

## 📁 Estrutura do Projeto

```
BootCampII-Intermediaria/
├── .github/
│   └── workflows/
│       └── ci.yml            # Pipeline de testes automáticos
├── node_modules/             # Dependências (ignorado pelo git)
├── .gitignore
├── app.js                    # Lógica e integração Supabase
├── app.tests.js              # Testes automatizados (Jest)
├── config.example.js         # Modelo de configuração (sem credenciais, apenas lembrete!)
├── favicon.ico               # Ícone do site
├── index.html                # Estrutura da aplicação
├── package.json
├── package-lock.json
├── README.md
└── style.css                 # Estilização (preto, ciano e gold)
```

---

## 🔄 Origem do Projeto

Este projeto foi originalmente desenvolvido em **Python (CLI)** durante o BootCamp II e convertido para uma aplicação web completa como entrega intermediária, mantendo a mesma lógica de validação e expandindo com:

- Interface gráfica web
- Autenticação de usuários
- Banco de dados na nuvem
- Testes automatizados
- Pipeline de CI/CD

Cloude Code usado nesse projeto!
---

<div align="center">

Desenvolvido durante o **BootCamp II — 2026**

</div>
