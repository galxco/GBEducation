# GBEducation — Módulo 1: Banco de Dados

## Estrutura gerada

```
gbeducation/
├── prisma/
│   ├── schema.prisma      ← Schema completo com todos os models
│   └── seed.ts            ← Seed com dados iniciais
├── .env.example           ← Template de variáveis de ambiente
├── package.json
└── tsconfig.json
```

## Models criados

| Model            | Descrição                                      |
|------------------|------------------------------------------------|
| `Usuario`        | Usuários do sistema (ALUNO, DOCENTE, ADMIN)    |
| `AreaConhecimento`| Áreas como TI, Saúde, Humanas                 |
| `Curso`          | Cursos vinculados a uma área                   |
| `Disciplina`     | Disciplinas dentro de um curso                 |
| `Tema`           | Temas de uma disciplina                        |
| `DocenteCurso`   | Vínculo N:N entre docente e curso              |
| `Material`       | Materiais com soft delete e índices de busca   |

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com sua string de conexão PostgreSQL
```

### 3. Criar o banco e rodar as migrations

```bash
npm run db:migrate
```

### 4. Gerar o Prisma Client

```bash
npm run db:generate
```

### 5. Rodar o seed

```bash
npm run db:seed
```

## Dados do seed

| Tipo            | Quantidade | Detalhes                                        |
|-----------------|------------|-------------------------------------------------|
| Admin           | 1          | admin@gbeducation.com / Admin@123               |
| Áreas           | 3          | TI, Ciências da Saúde, Ciências Humanas         |
| Cursos          | 6          | 2 por área                                      |
| Disciplinas     | 6          | 1 por curso                                     |
| Temas           | 6          | 1 por disciplina                                |

## Comandos úteis

```bash
npm run db:studio       
npm run db:reset        
npm run db:migrate:prod 
```

## Destaques do schema

- **Soft delete** no model `Material` via campo `deletadoEm DateTime?`
- **Índices de busca** em `titulo` e `descricao` de `Material`
- **Unique constraint** em `DocenteCurso` (docente + curso) evita duplicatas
- **Admin nunca via cadastro público** — criado exclusivamente via seed ou diretamente no banco
- `areaConhecimentoId` em `Usuario` é opcional (usado apenas por ALUNO)
