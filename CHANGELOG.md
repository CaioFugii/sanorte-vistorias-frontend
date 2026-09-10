# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- Aba **Equipes** em Dados de Segurança do Trabalho: mesmo gráfico multi-equipes da Qualidade
- Dados de Segurança do Trabalho: quadro de avaliações por checklist no lugar de Vistorias no período e Canteiro
- Aba **Serviços** em Dados de Qualidade: quantidade de equipes que atuaram em cada serviço no mês
- Aba **Fiscais** em Dados de Segurança do Trabalho: tabela mensal e gráfico de produção diária por usuário
- Aba **Visão Geral** em Dados de Segurança do Trabalho: gráfico de evolução mensal por serviço (mesmo formato da Qualidade)
- Aba **Não Conformidades** em Dados de Segurança do Trabalho: Top 10 por checklist e por equipe
- Exportação Excel das Ordens de Serviço (layout da listagem cadastrada)
- Exportação Excel do Ranking de Qualidade (layout da classificação avaliativa)
- Vínculo de equipes a um ou mais setores na criação e edição
- Limite de 50 perguntas por checklist no editor (espelha a trava da API)
- Escolha de Campo ou Pós-obra na criação de vistoria de Obras de Investimento
- Filtros de contrato, equipe, serviço e períodos (execução e vistoria) na tela de pendências
- Upload de evidência da vistoria nova direto ao S3 (URL pré-assinada; fallback multipart no ambiente local)
- Filtros por equipe PDA e resultado na tela de ordens de serviço
- Observações do fiscal no resumo do checklist da tela de detalhes da vistoria
- Distinção entre fotos gerais, fotos do checklist e resolução na tela de detalhes da vistoria
- Relatório PDF da vistoria com a mesma distinção de evidências (gerais, checklist e resolução)
- Observações do fiscal no PDF da vistoria
- Persistência de filtros e paginação na URL das listagens (`useListQueryState`); Voltar restaura o estado
- Filtro por contrato nas telas de usuários e equipes
- Select de complemento do título nos relatórios Ligação e passeio e Ligações (PDF `RELATÓRIO PREÇO {preço} {complemento}`)
- Data de emissão editável nos relatórios de engenharia (padrão: hoje)
- Campos de data dos relatórios no formato `dd/MM/yyyy`

### Removed

- Aba **Colaboradores** em Dados de Segurança do Trabalho

### Changed

- Fill e gestão de vistoria buscam o checklist completo em `GET /checklists/:id`; a listagem permanece slim
- Ranking de Qualidade: notas de Obras de Investimento entram em Campo ou Pós-obra conforme o tipo escolhido na vistoria
- Listagem de vistorias de Qualidade movida para a aba **Vistorias** em Dados (`/quality/analytics?tab=vistorias`); o item **Vistorias** saiu do menu de Qualidade
- Listagem de vistorias de Segurança do Trabalho movida para a aba **Vistorias** em Dados (`/safety/analytics?tab=vistorias`); o item **Vistorias** saiu do menu de Segurança do Trabalho
- Aba Vistorias de Qualidade com filtros por fiscal, equipe, serviço, status e períodos de execução e vistoria
- Logo da Sabesp nos relatórios fotográficos PDF (marca oficial em ciano)

### Fixed

- Datas dos relatórios de engenharia no PDF sem atraso de um dia (fuso UTC)
- Seletor de linhas por página nas listagens com filtros persistidos na URL

## [1.0.0] — 2026-06-18

Versão atual em `package.json`. Consolida a plataforma web de Gestão Operacional até o estado atual.

### Added

- Aplicação React + TypeScript (Vite, Material UI, Zustand, React Router)
- Autenticação JWT com perfis `ADMIN`, `GESTOR`, `SUPERVISOR` e `FISCAL`
- Menu lateral e guards de rota por perfil (`AppShell`, `router.tsx`)
- Dashboard gerencial com KPIs e rankings
- Módulos de analytics de **Qualidade** e **Segurança do Trabalho**
- Execução de vistorias em campo: criação, preenchimento, evidências, assinatura e finalização
- Gestão de pendências e resolução item a item
- Listagens de vistorias por módulo (Qualidade, Segurança, minhas vistorias)
- Cadastros administrativos: usuários, equipes, contratos, setores, colaboradores e checklists
- Ordens de serviço e obras de investimento
- Relatórios de engenharia com geração de PDF (jsPDF)
- Camada de dados via `IAppRepository` / `AppRepository` / `ApiRepository`
- Regras de domínio client-side: `validateFinalize`, `calculateScore`
- Integração com API documentada em `API_DOCUMENTATION.md`

### Changed

- Gráficos e telas de analytics evoluídas ao longo de março–jun/2026
- Fluxo de contratos integrado a equipes, usuários e vistorias (abr/2026)
- Módulo de relatórios expandido com novos templates PDF (abr/2026)

### Fixed

- Correções de tipos TypeScript após integração inicial com a API (fev/2026)
