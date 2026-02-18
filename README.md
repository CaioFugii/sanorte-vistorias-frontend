# Sanorte Vistorias - Frontend Offline-First

Aplicação React + TypeScript para execução de vistorias em campo com persistência local em IndexedDB e sincronização manual com API NestJS.

## Stack

- React 18 + TypeScript
- Material UI
- Zustand
- Axios
- Dexie (IndexedDB)
- React Router
- jsPDF

## Arquitetura

```
src/
  app/
    App.tsx
    AppShell.tsx
    router.tsx
  domain/
    enums.ts
    types.ts
    rules/
      calculateScore.ts
      determineStatus.ts
      validateFinalize.ts
  offline/
    db.ts
    repositories/OfflineRepository.ts
    sync/SyncService.ts
  api/
    apiClient.ts
    repositories/ApiRepository.ts
  repositories/
    IAppRepository.ts
    AppRepository.ts
  stores/
    authStore.ts
    referenceStore.ts
    inspectionStore.ts
    uiStore.ts
  pages/
  components/
```

## Setup

1. Instalar dependências:

```bash
npm install
```

2. Criar `.env`:

```bash
cp .env.example .env
```

3. Configurar URL da API:

```env
VITE_API_URL=http://localhost:3000
```

4. Executar em desenvolvimento:

```bash
npm run dev
```

## Fluxo Offline + Sync

- A UI sempre lê/escreve no IndexedDB (Dexie).
- Catálogos (`teams`, `checklists`) são carregados da API e cacheados localmente.
- Cada vistoria nasce com `externalId` (UUID) e `syncState=PENDING_SYNC`.
- Finalização:
  - assinatura obrigatória
  - foto obrigatória para item não conforme quando configurado
  - score local `CONFORME / avaliados`
  - status: `PENDENTE_AJUSTE` se houver `NAO_CONFORME`, senão `FINALIZADA`
- Sync manual no botão `Sincronizar`:
  - envia apenas `PENDING_SYNC`/`SYNC_ERROR`
  - usa endpoint `/sync/inspections`
  - atualiza `serverId`, `syncedAt`, `syncState`

## API Integrada

- `POST /auth/login`
- `GET /auth/me`
- `GET /teams`
- `GET /checklists?module=QUALIDADE`
- `POST /sync/inspections`

## Como testar modo offline (Chrome)

1. Fazer login online.
2. Atualizar catálogos (`Equipes`/`Checklists`) para garantir cache local.
3. Abrir DevTools > Network > marcar `Offline`.
4. Criar e preencher vistoria completa (itens, fotos, assinatura, finalizar).
5. Validar que aparece pendente de sincronização.
6. Voltar para `Online`.
7. Clicar em `Sincronizar` e confirmar atualização do status para `SYNCED`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
