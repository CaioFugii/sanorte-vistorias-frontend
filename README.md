# Sistema de Vistorias em Campo - Sanorte

Sistema web para gestão de vistorias em campo, desenvolvido com React + TypeScript e Material UI.

## 🚀 Tecnologias

- **React 18** - Biblioteca para construção de interfaces
- **TypeScript** - Tipagem estática
- **Material UI (MUI)** - Componentes de UI
- **Zustand** - Gerenciamento de estado
- **React Router** - Roteamento
- **Axios** - Cliente HTTP (preparado para futura integração)
- **Vite** - Build tool e dev server
- **jsPDF** - Geração de PDFs

## 📋 Funcionalidades

### Autenticação
- Login com seleção de usuário mock
- Controle de acesso baseado em roles (ADMIN, GESTOR, FISCAL)
- Guard de rotas

### Cadastros (ADMIN)
- **Equipes**: CRUD completo
- **Colaboradores**: CRUD completo
- **Checklists**: 
  - CRUD de checklists por módulo
  - Editor de itens com reordenação
  - Configuração de foto obrigatória em não conformidade

### Vistorias (Fluxo de Campo)
- **Nova Vistoria**: Criação com seleção de módulo, checklist, equipe e colaboradores
- **Preencher Vistoria**: 
  - Avaliação de itens do checklist (Conforme/Não Conforme/Não Aplicável)
  - Observações por item
  - Upload de fotos por item (obrigatório para não conformidades configuradas)
  - Fotos gerais
  - Assinatura digital do líder/encarregado
  - Cálculo automático de percentual
  - Validação antes de finalizar
- **Lista de Vistorias**: Visualização filtrada por role
- **Detalhes**: Visualização completa com evidências e assinatura
- **Geração de PDF**: Exportação de relatório (mock local)

### Dashboard (GESTOR/ADMIN)
- KPIs: Média geral, serviços avaliados, pendentes
- Ranking por equipes
- Filtros: período, módulo, equipe

### Pendências (GESTOR/ADMIN)
- Lista de vistorias com status PENDENTE_AJUSTE
- Resolução com notas e evidências de correção

## 🏗️ Arquitetura

O projeto segue uma arquitetura preparada para integração futura com API:

```
/src
  /app            # Router, providers, configuração
  /pages          # Telas da aplicação
  /components     # Componentes reutilizáveis
  /stores         # Stores Zustand
  /domain         # Types, enums, regras de negócio
  /data
    /mocks        # Dados mockados iniciais
    /repositories # Interface e implementações (Mock/Api)
  /services       # apiClient (Axios configurado)
  /utils          # Utilitários
```

### Repository Pattern

- **IAppRepository**: Interface comum
- **MockAppRepository**: Implementação atual com localStorage
- **ApiAppRepository**: Skeleton preparado para futura integração

Para trocar de mock para API, basta alterar o `RepositoryProvider.tsx`:

```typescript
// Atual (Mock)
const repository = new MockAppRepository();

// Futuro (API)
const repository = new ApiAppRepository();
```

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd sanorte-vistorias
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse no navegador:
```
http://localhost:5173
```

## 🔐 Usuários Mock

O sistema vem com 3 usuários pré-configurados:

- **Admin**: `admin@sanorte.com` (qualquer senha)
- **Gestor**: `gestor@sanorte.com` (qualquer senha)
- **Fiscal**: `fiscal@sanorte.com` (qualquer senha)

Ou selecione diretamente na tela de login.

## 💾 Persistência

Todos os dados são persistidos no **localStorage** do navegador. As chaves utilizadas são:

- `sanorte_teams`
- `sanorte_collaborators`
- `sanorte_checklists`
- `sanorte_checklist_items`
- `sanorte_inspections`
- `sanorte_inspection_items`
- `sanorte_evidences`
- `sanorte_signatures`
- `sanorte_pending_adjustments`
- `auth_user` (sessão)

## 📝 Regras de Negócio

### Cálculo de Percentual
```
Percentual = (CONFORME / avaliados) * 100
```
- `NAO_APLICAVEL` não conta como avaliado
- Apenas itens com resposta diferente de `null` e `NAO_APLICAVEL` são considerados

### Status ao Finalizar
- Se houver **qualquer** `NAO_CONFORME` → `PENDENTE_AJUSTE`
- Caso contrário → `FINALIZADA`

### Validações de Finalização
- Assinatura do líder/encarregado é **obrigatória**
- Todos os itens devem ser avaliados (exceto `NAO_APLICAVEL`)
- Itens `NAO_CONFORME` com `requiresPhotoOnNonConformity=true` **devem** ter foto

### Permissões
- **FISCAL**: Pode criar e editar apenas suas próprias vistorias. Não pode editar finalizadas.
- **GESTOR/ADMIN**: Pode visualizar e editar todas as vistorias, mesmo finalizadas.

## 🎨 Componentes Reutilizáveis

- `ModuleSelect`: Seleção de módulo
- `TeamSelect`: Seleção de equipe
- `CollaboratorsMultiSelect`: Seleção múltipla de colaboradores
- `ChecklistRenderer`: Renderização do checklist com avaliação
- `PhotoUploader`: Upload de fotos (gera dataUrl)
- `SignaturePad`: Canvas para assinatura digital
- `StatusChip`: Badge de status
- `PercentBadge`: Badge de percentual com cores

## 📄 Geração de PDF

Atualmente, a geração de PDF é feita localmente usando `jsPDF`. O PDF gerado contém informações básicas da vistoria.

**Futuro**: A geração será feita via API, apenas trocar a implementação no componente.

## 🚧 Próximos Passos (Integração com API)

1. Configurar variável de ambiente `VITE_API_BASE_URL`
2. Trocar `MockAppRepository` por `ApiAppRepository` no `RepositoryProvider`
3. Implementar endpoints conforme comentários em `ApiAppRepository.ts`
4. Ajustar tratamento de autenticação (tokens JWT)

## 📚 Scripts Disponíveis

- `npm run dev`: Inicia servidor de desenvolvimento
- `npm run build`: Gera build de produção
- `npm run preview`: Preview do build de produção
- `npm run lint`: Executa linter

## 🐛 Troubleshooting

### Erro ao carregar dados
- Limpe o localStorage: `localStorage.clear()` no console do navegador
- Recarregue a página

### Problemas com assinatura
- Certifique-se de que o canvas está renderizado antes de desenhar
- Limpe a assinatura e tente novamente

## 📄 Licença

Ver arquivo LICENSE.

## 👥 Desenvolvimento

Sistema desenvolvido seguindo as especificações fornecidas, com arquitetura preparada para evolução e integração futura com API backend.
