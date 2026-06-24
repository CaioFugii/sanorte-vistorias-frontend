# Sanorte Vistorias — Guia para Agentes (Frontend)

Guia para agentes e desenvolvedores trabalhando neste repositório: **SPA React** da plataforma **Gestão Operacional** da Sanorte Infraestrutura.

## Contexto do ecossistema

Este repositório é o **cliente web**. Repositórios relacionados:

| Repositório | Papel |
|-------------|-------|
| `sanorte-vistorias-backend` | API REST (NestJS + PostgreSQL) — fonte de verdade das regras persistidas |
| `specs/` (monorepo local) | Épicos e histórias de produto — consultar antes de features novas |

Documentação deste repo:

| Arquivo | Conteúdo |
|---------|----------|
| `README.md` | Setup e scripts |
| `ARCHITECTURE.md` | Camadas, rotas, fluxo de dados |
| `DOMAIN.md` | Enums, tipos e regras de negócio client-side |
| `CHANGELOG.md` | Histórico de versões |
| `API_DOCUMENTATION.md` | Payloads de request/response |

---

## Stack

- React 18, TypeScript, Vite
- Material UI, Zustand, Axios, React Router
- jsPDF (relatórios PDF no browser)

---

## Estrutura do código

```
src/
├── app/           App.tsx, AppShell, router, theme
├── domain/        enums, types, rules/ (validateFinalize, calculateScore)
├── api/           apiClient, ApiRepository
├── repositories/  IAppRepository (contrato), AppRepository (facade)
├── stores/        authStore, referenceStore, inspectionStore
├── pages/         Telas por rota
├── components/    UI reutilizável
└── utils/         PDF, upload de imagens, helpers
```

Path alias `@/` → `src/`.

---

## Padrões obrigatórios

### Acesso a dados

Páginas e stores usam `appRepository` — **nunca** `apiClient` diretamente em pages.

```typescript
// ❌ Evitar
const res = await apiClient.get("/inspections");

// ✅ Correto
const data = await appRepository.getInspections(params);
```

Fluxo: `Page → AppRepository → ApiRepository → apiClient → API`

Novas operações: `IAppRepository` → `ApiRepository` → `AppRepository` (se houver normalização).

### Organização

| Responsabilidade | Onde |
|------------------|------|
| Regras de negócio | `src/domain/rules/` |
| Estado global | `stores/` (Zustand) |
| Rotas | `app/router.tsx` |
| Menu e permissões por role | `app/AppShell.tsx` |
| Estilização | Material UI + `app/theme.ts` |

### Convenções

- Componentes funcionais com TypeScript
- Lógica complexa fora de JSX; validações espelham o backend
- Enums alinhados com `sanorte-vistorias-backend/src/common/enums/`

---

## Produto (resumo)

### Módulos de vistoria (`ModuleType`)

`CAMPO` | `REMOTO` | `POS_OBRA` | `SEGURANCA_TRABALHO` | `OBRAS_INVESTIMENTO`

### Perfis (`UserRole`)

| Role | Comportamento na UI |
|------|---------------------|
| `ADMIN` | Acesso total; CRUD de cadastros |
| `GESTOR` | Gestão, dashboards, vistorias |
| `SUPERVISOR` | Similar ao gestor, com restrições de menu |
| `FISCAL` | Campo; redirecionado para `/inspections/mine`; edita só `RASCUNHO` |

Seed (senha `senha123`): `admin@sanorte.com`, `gestor@sanorte.com`, `supervisor@sanorte.com`, `fiscal@sanorte.com`.

### Status de vistoria

`RASCUNHO` → `FINALIZADA` | `PENDENTE_AJUSTE` → `RESOLVIDA`

Detalhes completos: `DOMAIN.md`.

---

## Rotas principais

| Rota | Tela |
|------|------|
| `/login` | Login |
| `/dashboard` | Dashboard gerencial |
| `/quality/analytics`, `/safety/analytics` | Analytics |
| `/quality/inspections`, `/safety/inspections` | Listagens |
| `/inspections/mine` | Vistorias do fiscal |
| `/inspections/new` | Nova vistoria |
| `/inspections/:externalId/fill` | Preenchimento em campo |
| `/inspections/:externalId/manage` | Gestão de pendências |
| `/pendings` | Pendências |
| `/service-orders` | Ordens de serviço |
| `/investment-works` | Obras de investimento |
| `/reports/new` | Relatórios de engenharia |
| `/users`, `/teams`, `/contracts`, `/sectors`, `/collaborators`, `/checklists` | Administração |

Guards de rota em `router.tsx` **complementam** o menu em `AppShell.tsx` — ambos devem ser atualizados ao restringir acesso.

---

## Regras de negócio críticas (UI)

1. **FISCAL** só edita vistoria em `RASCUNHO`.
2. **Finalização** — validação em `domain/rules/validateFinalize.ts`: assinatura (exceto REMOTO, ST, POS_OBRA); evidência para `NAO_CONFORME` com `requiresPhotoOnNonConformity`.
3. **SEGURANCA_TRABALHO** — `teamId` opcional; não gera pendência na UI/backend.
4. **Paralisação** — penalidade de 25% na nota (valor vem da API).
5. **Pendências** — resolução item a item; vistoria → `RESOLVIDA` quando todos resolvidos.
6. **Limites de foto** — `domain/photoLimits.ts` (2 por item, 5 gerais).
7. **Identificadores** — rota usa `externalId`; `serverId` é o id interno da API.

---

## Setup e comandos

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm run dev
```

| Script | Uso |
|--------|-----|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint — **rodar antes de concluir** |
| `npm run preview` | Preview do build |

Não há suite de testes automatizados — validação via lint e teste manual.

---

## Quando a tarefa exige backend

Alterações que impactam API, schema ou regras persistidas exigem mudanças em `sanorte-vistorias-backend`:

- Novo endpoint ou campo na resposta
- Nova regra de permissão server-side
- Novo enum ou status

Mantenha `domain/enums.ts`, `domain/types.ts` e `API_DOCUMENTATION.md` alinhados.

Specs de produto (monorepo): `specs/SPEC-001.md` e demais histórias em `specs/`.

---

## Checklist antes de concluir

- [ ] Código alterado apenas neste repositório (salvo coordenação explícita com backend)
- [ ] Spec lida em `specs/` se for feature de produto
- [ ] `appRepository` / `IAppRepository` usados corretamente (sem axios direto em pages)
- [ ] Rotas e menu (`router.tsx` + `AppShell.tsx`) atualizados se mudou permissão
- [ ] Enums/tipos consistentes com o backend
- [ ] Regras de domínio em `domain/rules/` se aplicável
- [ ] `npm run lint` passa
- [ ] `CHANGELOG.md` atualizado se entrega relevante
