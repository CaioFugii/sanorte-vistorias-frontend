# Guia do Usuário - Sistema de Vistorias em Campo

Bem-vindo ao Sistema de Vistorias em Campo da Sanorte! Este guia irá te ajudar a entender e utilizar todas as funcionalidades da plataforma de acordo com o seu perfil de acesso.

> **Nota**: Este sistema está integrado com a API e requer conexão com a internet para funcionar. Todas as operações são realizadas em tempo real através do servidor.

## 📋 Índice

- [Primeiros Passos](#primeiros-passos)
- [Perfil: FISCAL](#perfil-fiscal)
- [Perfil: GESTOR](#perfil-gestor)
- [Perfil: ADMIN](#perfil-admin)
- [Dúvidas Frequentes](#dúvidas-frequentes)

---

## 🚀 Primeiros Passos

### Como Fazer Login

1. Acesse a plataforma no navegador
2. Na tela de login, preencha:
   - **Email**: Digite seu email cadastrado no sistema
   - **Senha**: Digite sua senha
3. Clique em **"Entrar"**

**⚠️ Importante**: 
- Use as credenciais fornecidas pelo administrador do sistema
- Se você esqueceu sua senha, entre em contato com o suporte técnico
- O sistema utiliza autenticação segura via API

### Entendendo a Interface

Após fazer login, você verá:
- **Menu lateral (Desktop)**: No lado esquerdo da tela
- **Menu hambúrguer (Mobile)**: Ícone de três linhas no canto superior esquerdo
- **Barra superior**: Mostra seu nome e permite sair do sistema

---

## 👷 Perfil: FISCAL

O perfil **FISCAL** é destinado aos profissionais que realizam vistorias em campo. Você tem acesso às funcionalidades essenciais para criar e preencher vistorias.

### Menu Disponível

- **Minhas Vistorias**: Lista todas as vistorias que você criou
- **Nova Vistoria**: Cria uma nova vistoria em campo
- **Sair**: Encerra sua sessão

---

### 📝 Como Criar uma Nova Vistoria

1. No menu, clique em **"Nova Vistoria"**
2. Preencha os campos obrigatórios:
   - **Módulo**: Selecione o tipo de vistoria
     - Segurança do Trabalho
     - Obras de Investimento
     - Obras Globais
     - Canteiro
   - **Checklist**: Após selecionar o módulo, escolha o checklist apropriado
   - **Equipe**: Selecione a equipe responsável
   - **Descrição do Serviço**: Descreva o serviço que está sendo vistoriado (obrigatório)
   - **Localização**: Informe o local da vistoria (opcional)
   - **Colaboradores Presentes**: Selecione os colaboradores que estão presentes (opcional)
3. Clique em **"Criar Vistoria"**
4. Você será redirecionado para a tela de preenchimento

---

### ✏️ Como Preencher uma Vistoria

Após criar ou abrir uma vistoria, você verá a tela de preenchimento com as seguintes seções:

#### 1. Informações da Vistoria
No topo da página, você verá um resumo com:
- Serviço
- Localização (se informada)
- Status atual
- Percentual de conformidade

#### 2. Checklist - Avaliação dos Itens

Para cada item do checklist:

1. **Selecione a avaliação** usando os botões de opção:
   - ✅ **Conforme**: Item está de acordo com o esperado
   - ❌ **Não Conforme**: Item apresenta problemas
   - ➖ **Não Aplicável**: Item não se aplica a esta vistoria

2. **Adicione observações** (opcional):
   - Clique no campo "Observações" abaixo de cada item
   - Digite informações relevantes sobre a avaliação

3. **Anexe fotos quando necessário**:
   - Se você marcou um item como **"Não Conforme"** e ele requer foto obrigatória, você verá um alerta amarelo
   - Clique em **"Adicionar Foto"** no item
   - Selecione a foto do seu dispositivo (formatos aceitos: JPG, PNG, WEBP, máximo 5MB por arquivo)
   - A foto será enviada para o servidor automaticamente
   - Você pode adicionar múltiplas fotos por item
   - Para remover uma foto, clique no ícone de lixeira

**⚠️ Importante**: Itens "Não Conforme" que exigem foto obrigatória **devem** ter pelo menos uma foto anexada para poder finalizar a vistoria.

#### 3. Fotos Gerais

1. Role a página até a seção **"Fotos Gerais"**
2. Clique em **"Adicionar Foto"**
3. Selecione fotos do seu dispositivo que sejam relevantes para a vistoria (não vinculadas a um item específico)
   - Formatos aceitos: JPG, PNG, WEBP
   - Tamanho máximo: 5MB por arquivo
4. Você pode adicionar até 10 fotos gerais
5. As fotos são enviadas para o servidor automaticamente ao serem selecionadas
5. As fotos são enviadas para o servidor automaticamente ao serem selecionadas

#### 4. Assinatura Digital

1. Role até a seção **"Assinatura do Líder/Encarregado"**
2. **Desenhe sua assinatura** no canvas usando o mouse ou o dedo (em dispositivos touch)
3. **Digite seu nome** no campo "Nome do líder/encarregado"
4. Se precisar refazer, clique em **"Limpar"**

**⚠️ Obrigatório**: A assinatura é obrigatória para finalizar a vistoria.

#### 5. Salvar e Finalizar

Durante o preenchimento:
- Clique em **"Salvar"** para salvar o progresso sem finalizar
- Você pode voltar e continuar depois

Para finalizar:
1. Certifique-se de que:
   - ✅ Todos os itens foram avaliados (ou marcados como Não Aplicável)
   - ✅ Todos os itens "Não Conforme" com foto obrigatória têm fotos anexadas
   - ✅ A assinatura foi preenchida
2. Clique em **"Finalizar"**
3. Confirme na janela de diálogo
4. O sistema irá:
   - Validar todas as informações
   - Calcular o percentual de conformidade
   - Definir o status (Finalizada ou Pendente Ajuste, se houver não conformidades)
   - Bloquear edições (você não poderá mais editar após finalizar)

**📊 Cálculo do Percentual**:
- O percentual é calculado automaticamente
- Fórmula: (Itens Conformes / Itens Avaliados) × 100
- Itens "Não Aplicável" não entram no cálculo
- Se houver qualquer "Não Conforme", a vistoria ficará como "Pendente Ajuste"

---

### 📋 Visualizar Minhas Vistorias

1. No menu, clique em **"Minhas Vistorias"**
2. Você verá uma tabela com todas as suas vistorias contendo:
   - Módulo
   - Descrição do serviço
   - Localização
   - Status (Rascunho, Finalizada, Pendente Ajuste, Resolvida)
   - Percentual de conformidade
   - Data
3. Clique no ícone de **👁️ (olho)** para ver os detalhes completos
4. Clique no ícone de **✏️ (lápis)** para editar (apenas se ainda estiver como Rascunho)

---

### 📄 Gerar PDF da Vistoria

1. Abra uma vistoria (criando nova ou visualizando existente)
2. Clique no botão **"Gerar PDF"** no topo da página
3. O PDF será gerado pela API e baixado automaticamente com todas as informações da vistoria, incluindo fotos e assinatura

---

### ⚠️ Regras Importantes para Fiscais

- ✅ Você pode criar quantas vistorias quiser
- ✅ Você pode editar suas vistorias enquanto estiverem como "Rascunho"
- ❌ **Você NÃO pode editar vistorias finalizadas** (apenas gestores podem)
- ✅ Você pode visualizar todas as suas vistorias, mesmo as finalizadas
- ✅ Vistorias com status "Pendente Ajuste" não podem ser editadas por você

---

## 👔 Perfil: GESTOR

O perfil **GESTOR** tem acesso a funcionalidades de gestão e acompanhamento. Você pode visualizar todas as vistorias, acompanhar indicadores e resolver pendências.

### Menu Disponível

- **Dashboard**: Visão geral com indicadores e rankings
- **Vistorias**: Lista todas as vistorias do sistema
- **Pendências**: Vistorias que precisam de ajustes
- **Sair**: Encerra sua sessão

---

### 📊 Dashboard - Visão Geral

O Dashboard é sua central de informações. Acesse pelo menu **"Dashboard"**.

#### Filtros Disponíveis

No topo do Dashboard, você pode filtrar os dados por:
- **Data Inicial**: Selecione a data de início do período
- **Data Final**: Selecione a data de fim do período
- **Módulo**: Filtre por tipo de vistoria
- **Equipe**: Filtre por equipe específica

Após selecionar os filtros, clique em **"Buscar"** para atualizar os dados.

#### Indicadores (KPIs)

Você verá três cards com indicadores principais:

1. **Média Geral**: Percentual médio de conformidade de todas as vistorias no período filtrado
2. **Serviços Avaliados**: Quantidade total de vistorias realizadas
3. **Pendentes**: Quantidade de vistorias com status "Pendente Ajuste"

#### Ranking por Equipes

Abaixo dos indicadores, há uma tabela com o ranking das equipes mostrando:
- **Equipe**: Nome da equipe
- **Média**: Percentual médio de conformidade da equipe
- **Qtd Vistorias**: Quantidade de vistorias realizadas pela equipe
- **Pendentes**: Quantidade de vistorias pendentes da equipe

As equipes são ordenadas da maior para a menor média de conformidade.

---

### 📋 Visualizar Todas as Vistorias

1. No menu, clique em **"Vistorias"**
2. Você verá uma tabela com **todas as vistorias do sistema** (não apenas as suas)
3. A tabela mostra:
   - Módulo
   - Descrição do serviço
   - Localização
   - Status
   - Percentual
   - Data
4. Clique no ícone **👁️ (olho)** para ver detalhes completos
5. Clique no ícone **✏️ (lápis)** para editar:
   - Você pode editar vistorias finalizadas (diferente dos fiscais)
   - Isso permite correções e ajustes quando necessário

---

### ⚠️ Resolver Pendências

Vistorias com status "Pendente Ajuste" precisam ser resolvidas após os ajustes serem feitos.

#### Como Resolver uma Pendência

1. No menu, clique em **"Pendências"**
2. Você verá uma lista de todas as vistorias com status "Pendente Ajuste"
3. Para cada pendência, você pode:
   - **Visualizar**: Clique no ícone 👁️ para ver os detalhes da vistoria
   - **Resolver**: Clique no ícone ✅ (check verde) para marcar como resolvida

4. Ao clicar em resolver, uma janela será aberta onde você deve:
   - **Notas de Resolução** (obrigatório): Descreva o que foi feito para resolver a pendência
   - **Evidência de Correção** (opcional): Anexe uma foto comprovando que o problema foi corrigido
     - Formatos aceitos: JPG, PNG, WEBP
     - Tamanho máximo: 5MB
5. Clique em **"Marcar como Resolvida"**
6. A vistoria terá seu status alterado para "Resolvida" e será removida da lista de pendências
7. Os dados são salvos na API e sincronizados em tempo real

**📝 Dica**: Sempre anexe evidências fotográficas quando possível, pois isso comprova que os ajustes foram realizados.

---

### 📄 Gerar PDF

Você pode gerar PDF de qualquer vistoria:
1. Abra os detalhes da vistoria
2. Clique em **"Gerar PDF"**
3. O PDF será gerado pela API e baixado automaticamente com todas as informações, fotos e assinatura

---

### ⚠️ Regras Importantes para Gestores

- ✅ Você pode visualizar **todas as vistorias** do sistema
- ✅ Você pode **editar vistorias finalizadas** (diferente dos fiscais)
- ✅ Você tem acesso ao Dashboard com indicadores
- ✅ Você pode resolver pendências
- ❌ Você **não pode** criar novas vistorias (apenas fiscais)
- ❌ Você **não pode** gerenciar cadastros (apenas admins)

---

## 🔧 Perfil: ADMIN

O perfil **ADMIN** tem acesso completo ao sistema, incluindo todas as funcionalidades de gestor mais os cadastros e configurações.

### Menu Disponível

- **Dashboard**: Visão geral com indicadores (mesmo do gestor)
- **Vistorias**: Lista todas as vistorias
- **Pendências**: Vistorias que precisam de ajustes
- **Equipes**: Gerenciar equipes do sistema
- **Colaboradores**: Gerenciar colaboradores
- **Checklists**: Criar e editar checklists
- **Sair**: Encerra sua sessão

---

### 👥 Gerenciar Equipes

As equipes são grupos de trabalho que realizam as vistorias.

#### Visualizar Equipes

1. No menu, clique em **"Equipes"**
2. Você verá uma tabela com todas as equipes cadastradas mostrando:
   - Nome da equipe
   - Status (Ativa/Inativa)
   - Ações (editar/excluir)

#### Criar Nova Equipe

1. Na página de Equipes, clique no botão **"Nova Equipe"** (canto superior direito)
2. Preencha os campos:
   - **Nome**: Nome da equipe (ex: "Equipe Alpha", "Equipe Beta")
   - **Ativa**: Marque se a equipe está ativa (desmarque para desativar)
3. Clique em **"Salvar"**

#### Editar Equipe

1. Na tabela de equipes, clique no ícone **✏️ (lápis)** da equipe desejada
2. Altere os campos necessários
3. Clique em **"Salvar"**

#### Excluir Equipe

1. Na tabela de equipes, clique no ícone **🗑️ (lixeira)** da equipe desejada
2. Confirme a exclusão na janela de diálogo

**⚠️ Atenção**: Ao excluir uma equipe, certifique-se de que não há vistorias vinculadas a ela.

---

### 👤 Gerenciar Colaboradores

Colaboradores são as pessoas que podem estar presentes durante uma vistoria.

#### Visualizar Colaboradores

1. No menu, clique em **"Colaboradores"**
2. Você verá uma tabela com todos os colaboradores cadastrados mostrando:
   - Nome do colaborador
   - Status (Ativo/Inativo)
   - Ações (editar/excluir)

#### Criar Novo Colaborador

1. Na página de Colaboradores, clique no botão **"Novo Colaborador"** (canto superior direito)
2. Preencha os campos:
   - **Nome**: Nome completo do colaborador
   - **Ativo**: Marque se o colaborador está ativo (desmarque para desativar)
3. Clique em **"Salvar"**

#### Editar Colaborador

1. Na tabela de colaboradores, clique no ícone **✏️ (lápis)** do colaborador desejado
2. Altere os campos necessários
3. Clique em **"Salvar"**

#### Excluir Colaborador

1. Na tabela de colaboradores, clique no ícone **🗑️ (lixeira)** do colaborador desejado
2. Confirme a exclusão na janela de diálogo

**💡 Dica**: Ao invés de excluir, você pode desativar um colaborador marcando "Ativo" como falso. Isso mantém o histórico mas impede que seja selecionado em novas vistorias.

---

### 📋 Gerenciar Checklists

Checklists são os formulários que os fiscais preenchem durante as vistorias. Cada checklist pertence a um módulo e contém vários itens de verificação.

#### Visualizar Checklists

1. No menu, clique em **"Checklists"**
2. Você verá abas no topo para cada módulo:
   - Segurança do Trabalho
   - Obras de Investimento
   - Obras Globais
   - Canteiro
3. Selecione a aba do módulo desejado
4. Você verá uma lista de checklists daquele módulo

#### Criar Novo Checklist

1. Na página de Checklists, clique no botão **"Novo Checklist"** (canto superior direito)
2. Preencha os campos:
   - **Módulo**: Selecione o módulo ao qual o checklist pertence
   - **Nome**: Nome do checklist (ex: "Checklist Segurança - Obra Residencial")
   - **Descrição**: Descrição detalhada do checklist (opcional)
   - **Ativo**: Marque se o checklist está ativo
3. Clique em **"Salvar"**
4. O checklist será criado e você poderá adicionar itens a ele

#### Editar Checklist

1. Na lista de checklists, clique no ícone **✏️ (lápis)** do checklist desejado
2. Altere os campos necessários
3. Clique em **"Salvar"**

**⚠️ Importante**: Você não pode alterar o módulo de um checklist após criá-lo.

---

### 📝 Gerenciar Itens do Checklist

Cada checklist precisa ter itens de verificação. Os itens são as perguntas/verificações que o fiscal responderá durante a vistoria.

#### Visualizar Itens de um Checklist

1. Na lista de checklists, clique na seta **▼** ao lado do checklist para expandir
2. Você verá todos os itens daquele checklist
3. Cada item mostra:
   - Título do item
   - Ordem (posição no checklist)
   - Se requer foto obrigatória em não conformidade

#### Adicionar Item ao Checklist

1. Expanda o checklist desejado
2. Clique no botão **"Adicionar Item"**
3. Preencha os campos:
   - **Título**: Nome/descrição do item (ex: "Uso de EPI adequado")
   - **Ordem**: Número que define a posição do item no checklist (1, 2, 3...)
   - **Requer foto em não conformidade**: 
     - ✅ Marque se quando o item for marcado como "Não Conforme", o fiscal DEVE anexar uma foto
     - ❌ Desmarque se a foto é opcional
4. Clique em **"Salvar"**

**💡 Dica**: Itens que requerem foto obrigatória são importantes para documentar problemas críticos.

#### Editar Item

1. Na lista de itens do checklist, clique no ícone **✏️ (lápis)** do item desejado
2. Altere os campos necessários
3. Clique em **"Salvar"**

#### Excluir Item

1. Na lista de itens do checklist, clique no ícone **🗑️ (lixeira)** do item desejado
2. Confirme a exclusão

**⚠️ Atenção**: Ao excluir um item, ele será removido de todas as vistorias futuras, mas permanecerá nas vistorias já criadas para manter o histórico.

---

### 📊 Dashboard e Vistorias

Como admin, você tem acesso ao Dashboard e à lista de Vistorias com as mesmas funcionalidades do perfil Gestor. Consulte a seção [Perfil: GESTOR](#perfil-gestor) para mais detalhes.

---

### ⚠️ Regras Importantes para Admins

- ✅ **Acesso total** a todas as funcionalidades
- ✅ Pode gerenciar cadastros (Equipes, Colaboradores, Checklists)
- ✅ Pode visualizar e editar todas as vistorias
- ✅ Pode resolver pendências
- ✅ Tem acesso ao Dashboard
- ⚠️ **Cuidado ao excluir**: Sempre verifique se não há vistorias vinculadas antes de excluir equipes, colaboradores ou itens de checklist

---

## ❓ Dúvidas Frequentes

### Geral

**P: Como faço para sair do sistema?**
R: Clique em "Sair" no menu lateral (ou no menu hambúrguer no mobile).

**P: Posso usar o sistema no celular?**
R: Sim! O sistema é mobile-first e funciona perfeitamente em smartphones e tablets.

**P: Os dados são salvos automaticamente?**
R: Não, os dados são salvos apenas quando você clica em "Salvar" na vistoria. Para finalizar, você precisa clicar em "Finalizar". Recomendamos salvar frequentemente para não perder informações. Os dados são salvos diretamente na API.

**P: O que acontece se eu perder a conexão com a internet?**
R: O sistema requer conexão com a internet para funcionar, pois todas as operações são realizadas através da API. Se você perder a conexão, salve seu trabalho antes e aguarde a conexão ser restaurada.

**P: Posso editar uma vistoria depois de finalizada?**
R: 
- **Fiscais**: Não, apenas gestores e admins podem editar vistorias finalizadas
- **Gestores/Admins**: Sim, você pode editar qualquer vistoria

### Vistorias

**P: O que acontece se eu marcar um item como "Não Conforme" sem anexar foto obrigatória?**
R: O sistema não permitirá finalizar a vistoria até que você anexe a foto obrigatória. Você verá um alerta amarelo indicando que a foto é obrigatória.

**P: Como é calculado o percentual de conformidade?**
R: O percentual é calculado automaticamente: (Itens Conformes / Itens Avaliados) × 100. Itens "Não Aplicável" não entram no cálculo.

**P: Por que minha vistoria ficou como "Pendente Ajuste" mesmo após finalizar?**
R: Isso acontece quando há pelo menos um item marcado como "Não Conforme". O sistema automaticamente define como "Pendente Ajuste" para que os problemas sejam corrigidos.

**P: Posso adicionar mais de uma foto por item?**
R: Sim! Você pode adicionar múltiplas fotos por item e também fotos gerais da vistoria. As fotos são enviadas para o servidor automaticamente e têm limite de 5MB cada.

**P: Quais formatos de imagem são aceitos?**
R: O sistema aceita imagens nos formatos JPG, PNG e WEBP, com tamanho máximo de 5MB por arquivo.

**P: Como funciona a assinatura digital?**
R: Você desenha sua assinatura no canvas usando o mouse ou o dedo (em touchscreen). A assinatura é convertida para formato digital e enviada para o servidor. É obrigatório preencher o nome e a assinatura para finalizar.

### Checklists

**P: Posso criar um checklist com zero itens?**
R: Tecnicamente sim, mas não é recomendado. Um checklist sem itens não terá utilidade para os fiscais.

**P: Posso alterar a ordem dos itens depois de criados?**
R: Sim, edite o item e altere o campo "Ordem". Os itens são ordenados numericamente.

**P: O que significa "Requer foto em não conformidade"?**
R: Quando marcado, se o fiscal avaliar o item como "Não Conforme", ele será obrigado a anexar pelo menos uma foto antes de finalizar a vistoria.

### Dashboard

**P: Os filtros do Dashboard são obrigatórios?**
R: Não, todos os filtros são opcionais. Se não selecionar nenhum, o Dashboard mostrará dados de todas as vistorias.

**P: Como o ranking de equipes é calculado?**
R: O ranking ordena as equipes pela média de percentual de conformidade, da maior para a menor.

### Pendências

**P: Quem pode resolver uma pendência?**
R: Apenas gestores e admins podem resolver pendências.

**P: É obrigatório anexar evidência ao resolver uma pendência?**
R: Não, a evidência é opcional, mas é altamente recomendado para comprovar que o problema foi corrigido. A evidência é enviada para o servidor e fica vinculada à resolução da pendência.

**P: O que acontece após resolver uma pendência?**
R: A vistoria terá seu status alterado para "Resolvida" e será removida da lista de pendências.

---

## 🆘 Precisa de Ajuda?

Se você encontrar problemas ou tiver dúvidas que não foram respondidas neste guia, entre em contato com o suporte técnico ou o administrador do sistema.

---

**Última atualização**: Versão 2.0 - Sistema de Vistorias em Campo (Integrado com API)
