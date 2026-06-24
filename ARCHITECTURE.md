# Arquitetura — Sanorte Vistorias (Frontend)

Aplicação web **React + TypeScript** para execução e gestão de vistorias de campo da Sanorte Infraestrutura. Consome a API REST do backend `sanorte-vistorias-backend`.

## Visão geral

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                        │
├─────────────────────────────────────────────────────────────┤
│  pages/          Telas por rota (UI + orquestração)         │
│  components/     Componentes reutilizáveis                  │
│  app/            Shell, router, tema, layout protegido      │
├─────────────────────────────────────────────────────────────┤
│  stores/         Estado global (Zustand)                     │
│  repositories/   Contrato IAppRepository + facade           │
│  api/            ApiRepository (HTTP via Axios)             │
├─────────────────────────────────────────────────────────────┤
│  domain/         Enums, tipos, regras de negócio            │
│  utils/          PDF, upload de imagens, helpers             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (JWT Bearer)
                           ▼
              sanorte-vistorias-backend (NestJS)
```

## Stack

| Camada | Tecnologia |
|--------|------------|
| UI | React 18, Material UI |
| Roteamento | React Router (createBrowserRouter) |
| Estado | Zustand |
| HTTP | Axios |
| Build | Vite |
| Relatórios | jsPDF |

## Estrutura de pastas

```
src/
├── app/              App.tsx, AppShell, router, theme
├── domain/           enums, types, rules/ (validateFinalize, calculateScore)
├── api/              apiClient, ApiRepository
├── repositories/     IAppRepository (contrato), AppRepository (facade)
├── stores/           authStore, referenceStore, inspectionStore
├── pages/            Uma tela por rota; subpastas por feature (ex.: analytics/)
├── components/       UI compartilhada (ChecklistRenderer, SignaturePad, etc.)
└── utils/            PDF, labels, prepareImageForUpload, snackbar
```

Path alias `@/` aponta para `src/`.

## Camadas e responsabilidades

### Pages

Cada rota tem uma page em `src/pages/`. Pages:

- Renderizam layout e formulários
- Leem/escrevem stores quando necessário
- Chamam métodos de `appRepository` — **nunca** Axios diretamente

### Repositories (padrão de acesso a dados)

```
Page → appRepository (AppRepository) → ApiRepository → apiClient → API
```

- **`IAppRepository`**: contrato tipado de todas as operações da aplicação
- **`AppRepository`**: facade que delega para `ApiRepository`, normaliza respostas e aplica helpers (ex.: compressão de imagem antes do upload)
- **`ApiRepository`**: implementação HTTP endpoint a endpoint

Esse padrão isola a UI da forma como os dados chegam (REST hoje; mock ou cache offline no futuro).

### Stores (Zustand)

| Store | Responsabilidade |
|-------|------------------|
| `authStore` | Token JWT, usuário logado, login/logout, helpers `hasRole` |
| `referenceStore` | Cache de dados de referência (equipes, setores, checklists) |
| `inspectionStore` | Estado da vistoria em preenchimento (rascunho em campo) |

Autenticação persiste `auth_token` e `auth_user` no `localStorage`.

### Domain

Contém enums (`UserRole`, `ModuleType`, `InspectionStatus`, etc.), tipos TypeScript e regras de negócio espelhadas do backend:

- `rules/validateFinalize.ts` — validação client-side antes de finalizar
- `rules/calculateScore.ts` — cálculo de nota percentual

Alterações de enum devem ser alinhadas com `sanorte-vistorias-backend/src/common/enums/`.

## Roteamento e autorização

O router (`src/app/router.tsx`) define:

1. **`ProtectedLayout`** — exige autenticação; redireciona para `/login`
2. **`BlockFiscalRoute`** — fiscal não acessa dashboards/gestão
3. **`BlockSupervisorRoute`** — supervisor bloqueado em rotas administrativas específicas
4. **`RoleAwareHomeRedirect`** — fiscal vai para `/inspections/mine`; demais para `/dashboard`

Permissões de menu lateral ficam em `AppShell.tsx` (`menuGroupsByRole`). **Guards de rota no frontend complementam, mas não substituem, a autorização no backend.**

### Rotas principais

| Rota | Tela | Acesso típico |
|------|------|---------------|
| `/login` | Login | Público |
| `/dashboard` | Dashboard gerencial | ADMIN, GESTOR, SUPERVISOR |
| `/quality/analytics` | Analytics de Qualidade | ADMIN, GESTOR, SUPERVISOR |
| `/safety/analytics` | Analytics de Segurança | ADMIN, GESTOR, SUPERVISOR |
| `/quality/inspections`, `/safety/inspections` | Listagens | ADMIN, GESTOR, SUPERVISOR |
| `/inspections/mine` | Vistorias do fiscal | FISCAL |
| `/inspections/new` | Nova vistoria | FISCAL (+ gestão) |
| `/inspections/:externalId/fill` | Preenchimento em campo | FISCAL (rascunho) |
| `/inspections/:externalId/manage` | Resolução de pendências | GESTOR, SUPERVISOR, ADMIN |
| `/pendings` | Pendências | ADMIN, GESTOR, SUPERVISOR |
| `/service-orders` | Ordens de serviço | ADMIN, GESTOR, SUPERVISOR |
| `/investment-works` | Obras de investimento | ADMIN, GESTOR, SUPERVISOR |
| `/reports/new` | Relatórios de engenharia | ADMIN, GESTOR, SUPERVISOR |
| `/users`, `/teams`, `/contracts`, `/sectors`, `/collaborators`, `/checklists` | Administração | ADMIN |

## Fluxo de uma vistoria (UI)

```
Nova vistoria (NewInspectionPage)
    → preenchimento (FillInspectionPage)
        → itens do checklist (ChecklistRenderer)
        → evidências (PhotoUploader → prepareImageForUpload → POST evidences)
        → assinatura (SignaturePad)
    → finalização (validateFinalize + POST finalize)
        → FINALIZADA ou PENDENTE_AJUSTE
    → gestão de pendências (ManageInspectionPage / PendingsPage)
        → resolução item a item
        → RESOLVIDA
```

Identificador de rota: `externalId` (UUID gerado no client). O backend também mantém `id` interno (`serverId` após normalização).

## Integração com a API

- Base URL: `VITE_API_URL` (padrão `http://localhost:3000`)
- Autenticação: header `Authorization: Bearer <token>` injetado pelo `apiClient`
- Erros HTTP disparam evento `app:api-error` com mensagens amigáveis
- Paginação: respostas `{ data, meta: { page, limit, total, totalPages, hasNext, hasPrev } }`

Documentação completa de payloads: `API_DOCUMENTATION.md`.

## Geração de PDF

Dois fluxos principais:

- **`utils/inspectionPdf.ts`** — PDF de vistoria finalizada
- **`utils/report-pdf/`** — relatórios de engenharia (templates, layout compartilhado, logos)

Geração ocorre no browser via jsPDF; não passa pelo backend.

## Componentes notáveis

| Componente | Uso |
|------------|-----|
| `ChecklistRenderer` | Renderiza seções/itens do checklist com respostas |
| `SignaturePad` | Captura assinatura do líder/encarregado |
| `PhotoUploader` | Upload de evidências com limite de tamanho |
| `StatusChip` / `PercentBadge` | Exibição de status e nota |
| `SectionTable`, `KpiCard`, `PageHeader` | Padrões visuais de listagem e dashboard |

Tema global em `app/theme.ts` (Material UI).

## Convenções de desenvolvimento

- Componentes funcionais com TypeScript
- Lógica de negócio complexa em `domain/rules/`, não em JSX
- Novas operações de API: adicionar em `IAppRepository` → `ApiRepository` → `AppRepository` (se houver transformação)
- Novas rotas: registrar em `router.tsx`, item de menu em `AppShell.tsx`, verificar role no backend
- Lint: `npm run lint`

## Relacionamento com o ecossistema

Este repositório é o **cliente web**. O monorepo local (`sanorte/`) também contém:

- `sanorte-vistorias-backend/` — API e persistência
- `specs/` — épicos e histórias de produto
- `AGENTS.md` — guia consolidado para agentes/desenvolvedores
