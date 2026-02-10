# Sistema de Vistorias em Campo - Sanorte

Sistema web para gestão de vistorias em campo, desenvolvido com React + TypeScript e Material UI.

## 📚 Documentação

- **[Guia do Usuário](./GUIA_DO_USUARIO.md)**: Guia completo e detalhado para cada perfil de usuário (FISCAL, GESTOR, ADMIN)
- Este README: Documentação técnica e de desenvolvimento

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
- Login via API com JWT
- Controle de acesso baseado em roles (ADMIN, GESTOR, FISCAL)
- Guard de rotas
- Gerenciamento automático de tokens

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
- **Geração de PDF**: Exportação de relatório via API

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
    /repositories # Interface e implementação da API
  /services       # apiClient (Axios configurado)
  /utils          # Utilitários
```

### Repository Pattern

- **IAppRepository**: Interface comum para acesso a dados
- **ApiAppRepository**: Implementação que faz chamadas à API real

O projeto utiliza o padrão Repository para abstrair o acesso a dados, facilitando manutenção e testes.

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

3. Configure as variáveis de ambiente:
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env e configure a URL da API
# Para desenvolvimento local, geralmente: http://localhost:3000
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse no navegador:
```
http://localhost:5173
```

## 🔐 Autenticação

O sistema utiliza autenticação via API com JWT (JSON Web Tokens). 

- Faça login com suas credenciais fornecidas pelo administrador
- O token de autenticação é armazenado no localStorage e enviado automaticamente em todas as requisições
- Em caso de token expirado ou inválido, você será redirecionado para a tela de login

## 💾 Persistência

Todos os dados são persistidos na **API backend**. O frontend armazena apenas:

- `auth_token`: Token JWT de autenticação
- `auth_user`: Dados do usuário logado (cache local)

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
- `PhotoUploader`: Upload de fotos (envia para API via FormData)
- `SignaturePad`: Canvas para assinatura digital
- `StatusChip`: Badge de status
- `PercentBadge`: Badge de percentual com cores

## 📄 Geração de PDF

A geração de PDF é feita via API através do endpoint `/inspections/:id/pdf`. O PDF gerado contém todas as informações da vistoria, incluindo fotos e assinatura.

## ⚙️ Variáveis de Ambiente

O projeto utiliza as seguintes variáveis de ambiente (definidas no arquivo `.env`):

- `VITE_API_BASE_URL`: URL base da API backend
  - Desenvolvimento: `http://localhost:3000`
  - Produção: URL do servidor de produção

Para configurar, copie o arquivo `.env.example` para `.env` e ajuste os valores conforme necessário.

## 📚 Scripts Disponíveis

- `npm run dev`: Inicia servidor de desenvolvimento
- `npm run build`: Gera build de produção
- `npm run preview`: Preview do build de produção
- `npm run lint`: Executa linter

## 🐛 Troubleshooting

### Erro ao carregar dados
- Verifique se a API está rodando e acessível
- Confirme se a variável `VITE_API_BASE_URL` está configurada corretamente no arquivo `.env`
- Verifique o console do navegador para erros de rede ou autenticação
- Se o token expirou, faça logout e login novamente

### Problemas com assinatura
- Certifique-se de que o canvas está renderizado antes de desenhar
- Limpe a assinatura e tente novamente

## 📄 Licença

Ver arquivo LICENSE.

## 👥 Desenvolvimento

Sistema desenvolvido seguindo as especificações fornecidas, com arquitetura baseada em Repository Pattern e totalmente integrado com a API backend.
