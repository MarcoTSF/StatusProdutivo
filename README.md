# 📊 Status Produtivo – Nocolok

Este repositório contém o projeto **Status Produtivo – Nocolok**, desenvolvido para monitorar, visualizar e gerenciar indicadores de produção de forma prática, organizada e acessível via navegador.

---

## 🚀 Objetivo do Projeto

O objetivo principal é disponibilizar uma aplicação leve e funcional para:

* Registrar dados de produção por máquina/linha.
* Gerar gráficos dinâmicos para análise rápida.
* Permitir o acompanhamento por data e horário.
* Auxiliar a gestão na identificação de gargalos, desvios e observações.

---

## 🏗️ Estrutura do Projeto

A aplicação é construída em **HTML, CSS e JavaScript puro**, com foco em simplicidade, velocidade e clareza. O projeto é organizado da seguinte forma:

```
📂 src
 ├── 📁 assets            # Imagens, logos e ícones
 ├── 📁 css               # Folhas de estilo
 ├── 📁 data              # Arquivos com dados gerados e carregados
 ├── 📁 js                # Scripts JS
 └── 📁 pages
       ├── graficos       # Página de gráficos dinâmicos
       ├── carregar-dados # Página para adicionar novos registros
       └── meses          # Páginas de conteúdo de cada mês

index.html                # Página home (informações do último mês disponível)
```

---

## 📈 Funcionalidades Implementadas

### ✔️ **Dashboard Dinâmico (Gráficos)**

* Exibe indicadores como: **objetivo, realizado, percentual e observações**.
* Gráficos atualizados de acordo com o último horário disponível.
* Apresentação automática do horário correspondente aos dados plotados.
* Suporte a múltiplos tipos de gráficos, inclusive doughnut.

### ✔️ **Leitura e Processamento de Dados via JS**

* Sistema lê arquivos JS estruturados contendo lista de máquinas e seus indicadores.
* Atualização instantânea dos gráficos após carregamento dos dados.

### ✔️ **Página de Cadastro de Dados**

* Formulário permite inserir novos dados diretamente pelo navegador.
* Dados ficam organizados por data, horário e máquina.

### ✔️ **Link da Logo como Navegação**

* A logo no header funciona como botão para retornar à página principal.

---

## 🧩 Lógica Importante

### 🔹 Carregamento do último horário automaticamente

O sistema sempre identifica o horário mais recente no arquivo JS e exibe seus dados, sem necessidade de seleção manual.

### 🔹 Ocultação de valores zerados

No Chart.js, valores iguais a 0 são filtrados antes da renderização.

### 🔹 Organização de máquinas

Lista mestre:

```
MASTER_MACHINE_LIST = [
  "Tubemill 16/22", "Tubemill 27",
  "Core 27.1", "Core 27.2", "Core 16.1", "Core 16.2", "Core 16.3",
  "Core Cds 01", "Core Cds 02", "Core Cds 3", "Core Atoc",
  "Crav.1", "Crav.2", "Crav.3", ...
]
```

Permite organizar e validar rapidamente cada entrada.

---

## 🛠️ Como Utilizar

### 1. **Clonar o Repositório**

```
git clone https://github.com/MarcoTSF/StatusProdutivo.git
```

### 2. **Abrir no Navegador**

Basta abrir o arquivo `index.html`.
Não há dependências externas.

### 3. **Adicionar Dados**

Acesse:

```
src/pages/carregar-dados/carregar-dados.html
```

### 4. **Visualizar Gráficos**

Acesse:

```
src/pages/graficos
```

Os gráficos serão gerados automaticamente.

---

## 📝 Estrutura dos Dados (JSON)

Exemplo:

```json
{
  "data": "31/out",
  "horario": "13:00h",
  "maquinas": {
    "Tubemill 16/22": { "obj": 55000, "real": 43680, "obs": "retenção" },
    "Tubemill 27": { "obj": 51000, "real": 44070, "obs": "troca de bobina" }
  }
}
```

---

## 📜 Licença

Este projeto está licenciado sob a licença **MIT**.
Você pode consultar o texto completo em:
[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
