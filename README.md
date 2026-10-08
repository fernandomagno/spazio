# Spazio

[![Abrir aplicação](https://img.shields.io/badge/Abrir%20aplica%C3%A7%C3%A3o-Render-46E3B7?style=for-the-badge)](https://spazio-deq9.onrender.com/v1/)
[![CI](https://github.com/fernandomagno/spazio/actions/workflows/ci.yml/badge.svg)](https://github.com/fernandomagno/spazio/actions/workflows/ci.yml)

Aplicação web de portaria para consulta e gerenciamento de moradores, veículos e movimentações de entrada e saída. O projeto usa somente recursos nativos do Node.js no backend e HTML, CSS e JavaScript no frontend.

> **Acesso público:** a aplicação completa está disponível em [Render](https://spazio-deq9.onrender.com/v1/), com frontend e backend Node.js executando juntos.

## Requisitos

- Node.js `>= 22.13.0` (necessário para o módulo nativo `node:sqlite` usado pelo servidor)
- Git, caso o projeto seja obtido por clonagem

Não há dependências externas para instalar: o `package.json` contém apenas o script de inicialização.

## Rodando localmente

### 1. Obter o projeto

```bash
git clone https://github.com/fernandomagno/spazio.git
cd spazio
```

Se o repositório já estiver disponível localmente, basta entrar na pasta do projeto.

### 2. Conferir a versão do Node.js

```bash
node --version
```

A versão precisa ser `22.13.0` ou superior.

### 3. Iniciar o servidor

```bash
npm start
```

Por padrão, a aplicação ficará disponível em <http://localhost:3000>. O arquivo `data/moradores.db` será criado automaticamente na primeira execução e está ignorado pelo Git.

Para usar outra porta:

```bash
PORT=8080 npm start
```

No Windows PowerShell:

```powershell
$env:PORT=8080; npm start
```

### 4. Acessar a interface

Abra <http://localhost:3000/v1/> no navegador. As telas disponíveis são:

- **Busca**: pesquisa moradores por nome, placa ou apartamento.
- **Cadastro**: cria moradores e associa carros ou motos.
- **Edição**: atualiza dados e veículos de moradores ativos.
- **Detalhes**: lista os dados dos moradores ativos.
- **Inativação**: marca moradores como inativos sem apagar o histórico.
- **Movimentação**: registra entrada e saída de carros ativos.
- **Relatório**: exibe a situação cadastral das unidades.

Para parar o servidor, use `Ctrl+C` no terminal.

## Estrutura do projeto

```text
spazio/
├── backend/
│   └── server.js                # HTTP, rotas, validações e SQLite
├── frontend/
│   └── v1/                      # Páginas, scripts e estilos da interface
├── data/
│   └── fixtures/
│       └── moradores.json       # Fixture anonimizada usada pela CI
├── .github/workflows/ci.yml     # Validação de sintaxe e smoke test
├── .gitignore                   # Ignora o banco SQLite local
├── package.json                 # Metadados e comando npm start
└── README.md                    # Documentação do projeto
```

O frontend está agrupado em `frontend/v1/`, acompanhando a versão pública da interface. O servidor publica essa pasta em `/v1`; o backend e os dados de teste ficam separados do código da interface.

## Arquitetura

```mermaid
flowchart LR
    U[Usuário] --> P[frontend/v1\nHTML/CSS/JS]
    P --> S[backend/server.js\nNode HTTP]
    S --> R{Roteamento}
    R --> E[Arquivos estáticos\nHTML, CSS e JS]
    R --> A[API de moradores\n/api/moradores]
    R --> V[API v1\n/api/v1/moradores]
    R --> M[API de movimentações\n/api/v1/movimentacoes]
    A --> D[(data/moradores.db\nSQLite)]
    V --> D
    M --> D
    D --> T1[moradores]
    D --> T2[veiculos]
    D --> T3[movimentacoes_veiculos]
    C[GitHub Actions\nci.yml] --> S
    C --> F[data/fixtures/moradores.json\nfixture de teste]
```

### Persistência

O banco é criado e atualizado pelo `backend/server.js` usando SQLite:

- `moradores`: dados cadastrais e status ativo/inativo.
- `veiculos`: veículos vinculados aos moradores.
- `movimentacoes_veiculos`: histórico das entradas e saídas.

O banco local não deve ser versionado. Para começar com uma base vazia, pare o servidor e remova `data/moradores.db` e os arquivos auxiliares `data/moradores.db-*`.

Na primeira execução após esta reorganização, se existir um `moradores.db` antigo na raiz, ele será copiado automaticamente para `data/moradores.db`.

## Rotas principais

### Interface

| URL | Função |
| --- | --- |
| `/v1/` | Busca |
| `/v1/cadastro-moradores.html` | Cadastro |
| `/v1/editar-moradores.html` | Edição |
| `/v1/detalhes-moradores.html` | Detalhes |
| `/v1/inativar-moradores.html` | Inativação |
| `/v1/movimentacao-veiculos.html` | Movimentação |
| `/v1/atualizacao-cadastro.html` | Relatório |
| `/v1/morador/{apto}` | Detalhes do apartamento |

As URLs antigas `/` e `/morador/{apto}` redirecionam para `/v1`.

### API

| Método | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/api/moradores` | Lista todos os moradores |
| `POST` | `/api/moradores` | Cadastra um morador |
| `PUT` | `/api/moradores/{id}` | Atualiza um morador |
| `GET` | `/api/v1/moradores` | Lista moradores ativos |
| `PATCH` | `/api/v1/moradores/{id}` | Inativa um morador |
| `GET` | `/api/v1/movimentacoes` | Lista carros e movimentações |
| `POST` | `/api/v1/movimentacoes` | Registra entrada ou saída |

## Validação e CI

Para executar localmente a mesma verificação básica de sintaxe dos arquivos JavaScript:

```bash
while IFS= read -r -d '' file; do node --check "$file"; done < <(find backend frontend -type f -name '*.js' -print0)
```

O workflow em `.github/workflows/ci.yml` executa a validação de sintaxe e um smoke test que inicia o servidor, cadastra a fixture `data/fixtures/moradores.json`, testa a inativação e verifica as rotas principais.

## Observações

- Não execute o servidor em uma pasta compartilhada com dados reais sem avaliar autenticação, autorização e proteção dos dados.
- O banco local contém dados persistentes; faça backup antes de removê-lo.
- O servidor aceita `PORT` por variável de ambiente e usa `3000` quando ela não está definida.
