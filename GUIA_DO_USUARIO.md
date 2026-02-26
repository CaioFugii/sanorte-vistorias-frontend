# Guia do Usuario - Sanorte Vistorias (Offline-First)

Este guia descreve o uso da aplicacao com base no comportamento atual do sistema web.
O fluxo principal e offline-first: voce pode trabalhar em campo sem internet, com sincronizacao posterior.

## 1) Visao geral rapida

- Acesso por login com perfil: `FISCAL`, `GESTOR` ou `ADMIN`.
- Dados de vistoria sao salvos localmente no dispositivo (IndexedDB).
- Quando houver internet, o sistema pode sincronizar automaticamente e tambem permite sincronizacao manual.
- O topo da aplicacao mostra: status `Online/Offline`, botao `Sincronizar (N)` e botao `Sair`.

## 2) Perfis e menus

### FISCAL

- `Minhas vistorias`
- `Nova vistoria`

### GESTOR

- `Dashboard`
- `Vistorias`
- `Pendencias`

### ADMIN

- `Dashboard`
- `Usuarios`
- `Equipes`
- `Setores`
- `Colaboradores`
- `Checklists`
- `Vistorias`
- `Pendencias`

## 3) Como o modo offline funciona

### O que funciona offline

- Criar vistoria (rascunho local).
- Preencher checklist e observacoes.
- Adicionar fotos (ficam salvas localmente quando nao houver upload online).
- Salvar assinatura do lider/encarregado.
- Finalizar vistoria localmente.
- Consultar vistorias que ja estao no banco local.

### O que depende de internet

- Login.
- Sincronizar dados com o servidor.
- Upload imediato de imagens para nuvem.
- Resolver item nao conforme por item (fluxo detalhado usa endpoint online).
- CRUD administrativo (`usuarios`, `equipes`, `setores`, `colaboradores`, `checklists`).
- Dashboard com dados oficiais da API.

### Indicadores de sincronizacao

- `Pendente` (`PENDING_SYNC`): alteracoes locais aguardando envio.
- `Sincronizando` (`SYNCING`): envio em andamento.
- `Sincronizado` (`SYNCED`): enviado com sucesso.
- `Erro ao sincronizar` (`SYNC_ERROR`): falha no envio.

### Sincronizacao automatica e manual

- **Automatica**: ao voltar online, ao entrar no app e ao trocar de rota (se houver pendencias).
- **Manual**: botao `Sincronizar (N)` no topo, habilitado quando online e com pendencias.

### Retencao de dados locais

- Vistorias `SYNCED` antigas podem ser removidas automaticamente apos 30 dias.
- Vistorias `PENDING_SYNC` e `SYNC_ERROR` nao sao removidas automaticamente.

## 4) Fluxo operacional - FISCAL

### 4.1 Criar nova vistoria

1. Abra `Nova vistoria`.
2. Preencha:
   - Modulo
   - Setor
   - Checklist
   - Equipe
   - Colaboradores (opcional)
   - Descricao do servico (obrigatorio)
   - Localizacao (opcional)
3. Clique em `Criar`.

Resultado: a vistoria e criada como `RASCUNHO` com identificador externo (`externalId`) e status de sync pendente.

### 4.2 Preencher vistoria

Na tela `Preencher vistoria`:

- Responda cada item com:
  - `Conforme`
  - `Nao conforme`
  - `Nao aplicavel`
- Adicione observacoes quando necessario.
- Anexe evidencias por item.
- Anexe fotos gerais.
- Capture assinatura e informe nome do signatario.

### 4.3 Salvar e finalizar

- Botao `Salvar`: persiste itens/assinatura localmente.
- Botao `Finalizar`: valida regras e conclui a vistoria.

Validacoes de finalizacao:

- Assinatura com nome obrigatorios.
- Todos os itens ativos precisam ter resposta.
- Item `Nao conforme` com foto obrigatoria exige evidencia.

Ao finalizar:

- Score calculado: conformes / avaliados (exclui `Nao aplicavel`).
- Se houver nao conformidade: status `PENDENTE_AJUSTE`.
- Se nao houver nao conformidade: status `FINALIZADA`.
- Vistoria fica marcada para sincronizacao.

### 4.4 Lista e detalhes

- Em `Minhas vistorias`, use:
  - `Ver` para abrir detalhes.
  - `Editar` apenas para status `RASCUNHO`.
- O status de sincronizacao aparece na listagem do fiscal.

## 5) Fluxo operacional - GESTOR

### 5.1 Dashboard

Use filtros:

- Data inicial
- Data final
- Modulo
- Equipe

E clique em `Buscar`.

Metricas exibidas:

- Media geral
- Servicos avaliados
- Pendentes
- Ranking por equipes

### 5.2 Vistorias

- Visualiza listagem geral.
- Pode abrir detalhes e acompanhar status/percentual.

### 5.3 Pendencias

Em `Pendencias`:

1. Abra `Ver e resolver`.
2. Resolva cada item nao conforme:
   - Informe notas de resolucao (obrigatorio).
   - Anexe evidencia de correcao (opcional).
3. Depois que todos os itens estiverem resolvidos, finalize a resolucao da vistoria quando aplicavel.

## 6) Fluxo operacional - ADMIN

O perfil admin possui as capacidades do gestor e tambem os cadastros.

### 6.1 Usuarios

- Criar: `Novo usuario`.
- Editar: nome, email, perfil e senha (opcional na edicao).
- Excluir: icone de lixeira.

Perfis disponiveis:

- `ADMIN`
- `GESTOR`
- `FISCAL`

### 6.2 Equipes

- Criar/editar/excluir equipe.
- Definir status ativa/inativa.
- Associar colaboradores.
- Atualizar dados via `Atualizar catalogo`.

### 6.3 Setores

- Criar/editar/excluir setor.
- Definir status ativo/inativo.
- Nao e possivel excluir setor vinculado a colaboradores ou checklists.

### 6.4 Colaboradores

- Criar/editar/excluir colaborador.
- Informar setor obrigatorio no cadastro/edicao.
- Definir status ativo/inativo.

### 6.5 Checklists

- Criar/editar/excluir checklist.
- Informar setor obrigatorio no cadastro/edicao.
- Criar/editar secoes.
- Criar/editar/excluir itens.
- Definir:
  - ordem
  - ativo/inativo
  - foto obrigatoria em nao conformidade
- Atualizar dados via `Atualizar catalogo`.

## 7) Regras importantes de negocio

- Edicao de vistoria e permitida apenas em `RASCUNHO`.
- Assinatura e obrigatoria para finalizar.
- `Nao aplicavel` nao entra no denominador do score.
- Se todos os itens avaliaveis forem `Nao aplicavel`, score final = 100%.
- Resolver vistoria depende da resolucao de todos os itens nao conformes.

## 8) FAQ por perfil

### FAQ - FISCAL

**1. Posso criar e preencher vistoria sem internet?**  
Sim. O fluxo de criacao/preenchimento/finalizacao funciona localmente.

**2. O que acontece com minhas fotos quando estou offline?**  
Elas ficam salvas localmente e sao enviadas na sincronizacao quando houver internet.

**3. Como sei se minha vistoria subiu para o servidor?**  
Pelo status de sincronizacao (`Sincronizado`) e reducao do contador no botao `Sincronizar (N)`.

**4. Posso editar vistoria finalizada?**  
Nao. Apenas vistoria em `RASCUNHO` permite edicao.

**5. Finalizei, mas nao aparece no servidor. O que fazer?**  
Verifique conexao, clique em `Sincronizar` e confira se ha `Erro ao sincronizar`.

**6. Preciso responder todos os itens para finalizar?**  
Sim, todos os itens ativos precisam de resposta.

### FAQ - GESTOR

**1. Posso acompanhar pendencias no modo offline?**  
Sim, com base no que ja estiver salvo localmente.

**2. Quem pode resolver nao conformidade?**  
Gestor e admin no fluxo de acompanhamento; fiscal resolve no proprio fluxo de campo.

**3. Posso resolver item sem nota?**  
Nao. Nota de resolucao e obrigatoria.

**4. Evidencia de resolucao e obrigatoria?**  
Nao, e opcional (mas recomendada).

**5. O dashboard funciona sem internet?**  
Existe fallback local, mas os numeros oficiais sao obtidos online pela API.

**6. Por que nao consigo marcar vistoria como resolvida?**  
Porque ainda existe item nao conforme sem resolucao.

### FAQ - ADMIN

**1. O que somente admin pode fazer?**  
Gerenciar usuarios, equipes, setores, colaboradores e checklists.

**2. Posso usar os cadastros administrativos offline?**  
Nao. Esses CRUDs dependem da API online.

**3. Posso trocar perfil de um usuario existente?**  
Sim, na edicao de usuario.

**4. Posso criar item de checklist com foto obrigatoria?**  
Sim, no cadastro de item habilite a opcao de foto obrigatoria em nao conformidade.

**5. O que ocorre se eu inativar checklist/item?**  
Ele deixa de ser usado no fluxo operacional conforme configuracao ativa.

**6. Quando devo usar "Atualizar catalogo"?**  
Sempre que quiser forcar recarga de equipes/setores/checklists do servidor para o cache local.

## 9) Boas praticas para operacao em campo

1. Entre no sistema ainda online.
2. Atualize catalogos antes de sair para campo.
3. Durante o trabalho, salve com frequencia.
4. Ao recuperar conexao, sincronize e confirme se nao restaram erros.

## 10) Suporte

Em caso de duvida operacional, contate o responsavel funcional do processo ou o suporte tecnico da plataforma.

---

Ultima atualizacao: fevereiro/2026
