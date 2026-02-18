# Guia do Usuário - Sistema de Vistorias em Campo (Offline-First)

Bem-vindo ao Sistema de Vistorias em Campo da Sanorte. Este guia foi atualizado para a versão **offline-first**, na qual o trabalho de campo acontece localmente no dispositivo e a sincronização com a API é feita manualmente.

## Índice

- Primeiros passos
- Fluxo offline e sincronização
- Perfil FISCAL
- Perfil GESTOR
- Perfil ADMIN
- Dúvidas frequentes

---

## Primeiros passos

### Login

1. Acesse o sistema.
2. Informe email e senha.
3. Clique em **Entrar**.

> Observação: o login depende de conexão com internet para autenticar na API.

### Interface geral

Após login, você verá:
- menu lateral (ou menu hambúrguer no mobile);
- barra superior com seu nome, botão **Sincronizar (X)** e **Sair**;
- banner de aviso quando estiver offline.

---

## Fluxo offline e sincronização

### Como funciona

- Durante o uso, os dados de vistorias são salvos localmente no dispositivo.
- É possível criar/preencher/finalizar vistorias sem internet.
- Quando houver conexão, use o botão **Sincronizar** para enviar pendências ao servidor.

### Indicadores visuais

- **Banner offline**: aparece quando não há internet.
- **Contador de pendências** no botão de sincronização.
- **Status de sync** nas listagens:
  - `PENDING_SYNC`
  - `SYNCING`
  - `SYNCED`
  - `SYNC_ERROR`

### Boas práticas

1. Faça login online.
2. Atualize catálogos de **Equipes** e **Checklists**.
3. Vá a campo e trabalhe normalmente (offline se necessário).
4. Ao voltar para rede, clique em **Sincronizar**.

---

## Perfil FISCAL

### Menu disponível

- **Minhas vistorias** (`/inspections/mine`)
- **Nova vistoria** (`/inspections/new`)
- **Todas** (listagem geral local)
- **Sair**

### Criar nova vistoria

1. Abra **Nova vistoria**.
2. Preencha:
   - Checklist
   - Equipe
   - Descrição do serviço
   - Localização
3. Clique em **Criar**.

O sistema gera um identificador externo (UUID) para sync idempotente.

### Preencher vistoria

Na tela de preenchimento:

1. Responda cada item:
   - **Conforme**
   - **Não conforme**
   - **Não aplicável**
2. Preencha observações quando necessário.
3. Anexe fotos por item.
4. Anexe fotos gerais da vistoria.
5. Capture assinatura e informe nome do líder/encarregado.

> Observação: no topo da tela existem os botões **PDF**, **Salvar** e **Finalizar**.
> O botão **Salvar** persiste a assinatura preenchida.

### Finalização

Ao finalizar, o sistema valida:
- assinatura obrigatória;
- item não conforme com foto obrigatória precisa de evidência;
- checklist respondido.

Depois disso:
- calcula score (`conformes / avaliados`);
- define status:
  - com não conformidade: `PENDENTE_AJUSTE`;
  - sem não conformidade: `FINALIZADA`;
- marca para sincronização.

### PDF offline

Você pode gerar PDF localmente na própria tela da vistoria.

### Lista de vistorias

Na tela de listagem, os botões de ação são:
- **Ver**: abre detalhes;
- **Editar**: abre preenchimento.

---

## Perfil GESTOR

### Menu disponível

- **Dashboard**
- **Vistorias**
- **Pendências**
- **Sair**

### Dashboard

Exibe dados com filtros da API quando online e fallback local quando offline.

Filtros disponíveis na tela:
- **Data inicial**
- **Data final**
- **Módulo**
- **Equipe**
- botão **Buscar**

Indicadores exibidos:
- média geral;
- total de vistorias;
- total pendente de ajuste;
- ranking por equipes;
- quantidade pendente de sincronização.

### Pendências

Em **Pendências**, você pode:
1. abrir uma pendência;
2. registrar nota de resolução;
3. anexar evidência opcional;
4. clicar em **Marcar como Resolvida**.

Essa ação também fica pendente de sincronização.

---

## Perfil ADMIN

### Menu disponível

- **Dashboard**
- **Usuários**
- **Equipes**
- **Colaboradores**
- **Checklists**
- **Vistorias**
- **Pendências**
- **Sair**

### Usuários

Na tela **Usuários** (ADMIN), é possível:

- criar usuário com nome, email, senha e perfil;
- editar usuário existente (incluindo troca opcional de senha);
- excluir usuário.

Rótulos principais da tela:
- botão **Novo usuário**;
- modal com botão **Salvar**.

Perfis disponíveis:
- `ADMIN`
- `GESTOR`
- `FISCAL`

### Equipes

Na tela **Equipes** (ADMIN), é possível:

- criar equipe;
- editar nome/status da equipe;
- excluir equipe;
- usar **Atualizar catálogo** para sincronizar lista com a API.

Rótulos principais da tela:
- botão **Nova equipe**;
- modal com botão **Salvar**.

### Colaboradores

Na tela **Colaboradores** (ADMIN), é possível:

- criar colaborador;
- editar nome/status;
- excluir colaborador.

Rótulos principais da tela:
- botão **Novo colaborador**;
- modal com botão **Salvar**.

### Checklists

Na tela **Checklists** (ADMIN), é possível:

- criar checklist;
- editar checklist;
- excluir checklist;
- criar/editar seções;
- criar/editar/excluir itens de seção;
- configurar item com **foto obrigatória em não conformidade**;
- atualizar catálogo diretamente da API.

Rótulos principais da tela:
- botão **Novo checklist**;
- botão **Nova seção** dentro de cada checklist;
- botão **Salvar** nos modais de checklist, seção e item.

---

## Regras de negócio importantes

- Respostas: `CONFORME`, `NAO_CONFORME`, `NAO_APLICAVEL`.
- Score: `conformes / avaliados` (avaliados = resposta diferente de `NAO_APLICAVEL`).
- Se todos os itens forem não aplicáveis, score é tratado como 100%.
- Finalização com qualquer não conformidade gera `PENDENTE_AJUSTE`.
- Assinatura do líder/encarregado é obrigatória para finalizar.

---

## Dúvidas frequentes

**Posso trabalhar sem internet?**  
Sim. O preenchimento da vistoria foi feito para funcionar offline.

**Quando os dados vão para o servidor?**  
Quando você clicar em **Sincronizar** e houver conexão.

**Como sei se uma vistoria já subiu?**  
Pelo status de sincronização (`SYNCED` quando enviada com sucesso).

**Perco dados se fechar a tela?**  
Não. As mudanças são persistidas localmente.

**Quem resolve pendências?**  
Gestor e Admin.

**ADMIN consegue cadastrar usuários, equipes, colaboradores e checklists?**  
Sim. Essas telas têm CRUD ativo nesta versão.

**Quais nomes de botões devo procurar na interface?**  
`Novo usuário`, `Nova equipe`, `Novo colaborador`, `Novo checklist`, `Nova seção`, `Salvar`, `Buscar`, `Resolver`, `Marcar como Resolvida`, `Ver`, `Editar`.

---

## Precisa de ajuda?

Se houver dúvidas operacionais, procure o responsável funcional da equipe ou o suporte técnico.

---

**Última atualização**: Versão offline-first (manual sync + IndexedDB)
