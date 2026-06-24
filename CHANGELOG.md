# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- `ARCHITECTURE.md` — documentação de arquitetura do frontend
- `DOMAIN.md` — enums, tipos e regras de negócio do client
- `CHANGELOG.md` — histórico de alterações

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
