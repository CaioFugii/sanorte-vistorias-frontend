# Sanorte Vistorias - Frontend

Aplicação React + TypeScript para execução de vistorias em campo, integrada à API NestJS.

## Stack

- React 18 + TypeScript
- Material UI
- Zustand
- Axios
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

## API Integrada

- `POST /auth/login`
- `GET /auth/me`
- `GET /teams`
- `GET /checklists?module=QUALIDADE`
- `POST /inspections`
- `PUT /inspections/:id`
- `PUT /inspections/:id/items`
- `POST /inspections/:id/evidences`
- `POST /inspections/:id/signature`
- `POST /inspections/:id/finalize`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
