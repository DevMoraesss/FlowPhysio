# PhysioFlow — Frontend

Interface web do sistema PhysioFlow, construída com **Next.js 15** (App Router), **TypeScript** e **TailwindCSS**.

---

## Índice

1. [Como Rodar](#como-rodar)
2. [Variáveis de Ambiente](#variáveis-de-ambiente)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Design System](#design-system)
5. [Telas do Sistema](#telas-do-sistema)
6. [Componentes Compartilhados](#componentes-compartilhados)
7. [Autenticação e API](#autenticação-e-api)

---

## Como Rodar

```bash
cd PhysioFlow-web
npm install
npm run dev
```

Acesse: `http://localhost:3000`

---

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz de `PhysioFlow-web/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Estrutura de Pastas

```
PhysioFlow-web/
├── app/                          # App Router (Next.js 15)
│   ├── page.tsx                  # Redireciona para /login ou /dashboard
│   ├── login/page.tsx            # Tela de login
│   ├── register/page.tsx         # Tela de cadastro de fisioterapeuta
│   ├── dashboard/page.tsx        # Painel do dia
│   ├── schedule/
│   │   ├── page.tsx              # Agenda (FullCalendar)
│   │   └── new/page.tsx          # Novo agendamento
│   ├── patients/
│   │   ├── page.tsx              # Lista de pacientes
│   │   ├── new/page.tsx          # Cadastrar paciente
│   │   └── [id]/
│   │       ├── page.tsx          # Prontuário completo do paciente
│   │       ├── edit/page.tsx     # Editar dados do paciente
│   │       ├── assessments/
│   │       │   ├── new/page.tsx          # Nova avaliação / anamnese
│   │       │   └── [assessmentId]/page.tsx  # Detalhes de avaliação
│   │       ├── evolutions/
│   │       │   └── new/page.tsx          # Nova evolução clínica
│   │       └── protocols/
│   │           ├── page.tsx              # Lista de protocolos
│   │           └── new/page.tsx          # Novo protocolo
│   ├── payments/page.tsx         # Financeiro (pendentes + histórico)
│   ├── records/page.tsx          # Prontuários — busca rápida por paciente
│   └── settings/page.tsx         # Perfil do fisioterapeuta
│
├── components/
│   ├── Sidebar.tsx               # Menu lateral fixo
│   └── Dialog.tsx                # Modal de confirmação/alerta reutilizável
│
└── lib/
    └── api.ts                    # apiFetch: wrapper com JWT + timeout + 401 redirect
```

---

## Design System

O PhysioFlow usa um tema personalizado de **saúde e bem-estar** com tons verdes sálvia e teal.

### Cores principais

| Token            | Valor          | Uso                                      |
|------------------|----------------|------------------------------------------|
| `brand-primary`  | `#14b8a6` (teal-500) | Botões primários, links, progresso  |
| `brand-secondary`| `#0d9488` (teal-600) | Hover de botões primários           |
| `brand-soft`     | `rgba(20,184,166,0.1)` | Backgrounds suaves de badges      |
| `sage-50`        | `#f8faf9`      | Background da página                     |
| `sage-100`–`800` | tons verdes claros | Bordas, textos secundários, separadores |

### Padrões visuais

- **Bordas arredondadas:** `rounded-[2rem]` e `rounded-[2.5rem]` nos cards (canto bem arredondado)
- **Sombra:** classe `wellness-shadow` (sombra suave e difusa)
- **Tipografia:** serif para títulos (`font-serif`), sans-serif para texto corrido
- **Dark mode:** todas as telas suportam tema escuro via classes `dark:`
- **Inputs:** classe `wellness-input` — bordas arredondadas, foco com anel teal
- **Loading:** spinner com `border-brand-primary border-t-transparent animate-spin`
- **Badges de status:** arredondados (`rounded-full`), fundo suave + texto colorido

---

## Telas do Sistema

---

### Login — `/login`

Tela de entrada do sistema.

**Visual:**
- Fundo dividido: painel esquerdo escuro com gradiente teal, painel direito branco com o formulário
- Logo e nome do sistema no topo
- Campos: Email e Senha
- Botão "Entrar" com loading spinner durante o request
- Link para criar conta

**Comportamento:**
- Token JWT armazenado em `localStorage` (`physioflow_token`)
- Dados do usuário armazenados em `localStorage` (`physioflow_user`)
- Redireciona para `/dashboard` após login bem-sucedido
- Exibe mensagem de erro se credenciais inválidas

---

### Cadastro — `/register`

Criação de conta de fisioterapeuta.

**Visual:**
- Mesmo layout bipartido do login
- Campos: Nome completo, Email, Senha, CREFITO (opcional)

**Comportamento:**
- Após cadastro bem-sucedido, redireciona para `/login`

---

### Dashboard — `/dashboard`

Visão geral do dia atual.

**Visual:**
```
┌─────────────────────────────────────────────────────┐
│  Bom dia, [Nome]          [sino de notificações]    │
│  Painel do Dia                                       │
├──────────┬──────────┬──────────────┬────────────────┤
│ Agenda-  │ Concluí- │ Faltas /     │ Receita do Dia │
│ mentos   │ dos      │ Cancelados   │ R$ 0,00        │
│    0     │    0     │    0         │                │
├──────────┴──────────┴──────────────┴────────────────┤
│  [Ações rápidas]                                    │
│  ┌──────────────────────┐ ┌─────────────────────┐  │
│  │ 📅 Novo Agendamento  │ │ 👤 Cadastrar Paciente│  │
│  └──────────────────────┘ └─────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  Agenda de Hoje                                     │
│  [lista de sessões com horário e badge de status]   │
├─────────────────────────────────────────────────────┤
│  ⚠️ Faltaram e não remarcaram                       │
│  [lista de pacientes com botão "Remarcar"]          │
└─────────────────────────────────────────────────────┘
```

**Comportamento:**
- Cards de estatísticas: total, concluídos, faltas+cancelados, receita do dia
- Lista de sessões do dia com link para o prontuário do paciente
- Seção de alertas: pacientes que faltaram sem reagendar, com atalho para remarcar
- Saudação dinâmica (Bom dia / Boa tarde / Boa noite) baseada no horário

---

### Agenda — `/schedule`

Calendário completo de agendamentos.

**Visual:**
```
┌─────────────────────────────────────────────────────┐
│  Minha Agenda            [+ Novo Agendamento]       │
├─────────────────────────────────────────────────────┤
│  FullCalendar — visualização Semana/Mês/Dia         │
│                                                     │
│  Eventos coloridos por status:                      │
│  🔵 Azul claro  = Agendada                          │
│  🟢 Verde       = Concluída                         │
│  🔴 Vermelho    = Falta                             │
│  ⚫ Cinza       = Cancelada                         │
└─────────────────────────────────────────────────────┘
```

**Modal de detalhes** (ao clicar num evento):
```
┌─────────────────────────────┐
│  Detalhes da Sessão      [X]│
│  👤 Nome do Paciente        │
│  📅 Data                    │
│  🕐 Horário início – fim    │
│  💰 Valor da sessão         │
├─────────────────────────────┤
│  [Ações conforme status]    │
│                             │
│  Se status = Agendada:      │
│   • Paciente Por Sessão:    │
│     [Concluir Sessão]       │
│     → abre select de forma  │
│       de pagamento          │
│       (Pix/Dinheiro/Cartão/ │
│        Pagar depois)        │
│                             │
│   • Paciente Quinzenal /    │
│     Mensal / Semanal:       │
│     [aviso amarelo]         │
│     [Concluir Sessão]       │
│     (pagamento fica pend.)  │
│                             │
│   • [Falta]  [Cancelar]     │
│                             │
│  Se status ≠ Agendada:      │
│   • Badge com status final  │
│   • [Fechar]                │
└─────────────────────────────┘
```

**Comportamento:**
- Clique em data vazia → redireciona para `/schedule/new?date=YYYY-MM-DD`
- Clique em evento → abre modal de detalhes
- Ao concluir/faltar/cancelar → calendário atualiza automaticamente
- Conflito de horário é verificado pelo backend

---

### Novo Agendamento — `/schedule/new`

Formulário de criação de agendamento.

**Visual:**
- Select de paciente com busca (filtra conforme digita)
- Ao selecionar paciente: mostra card com ciclo de pagamento e valor padrão
- Campos: data, hora início, hora fim, valor da sessão (pré-preenchido com valor padrão do paciente), observações
- Se paciente tiver ciclo Quinzenal/Mensal/Semanal: mostra badge informativo "Cobrança [ciclo] — será cobrada depois"
- Se paciente Por Sessão: mostra select de forma de pagamento

**Comportamento:**
- Data pode vir pré-preenchida via query string `?date=YYYY-MM-DD`
- Paciente pode ser pré-selecionado via query string `?patientId=GUID` (usado no botão "Remarcar" do dashboard)

---

### Lista de Pacientes — `/patients`

**Visual:**
```
┌─────────────────────────────────────────────────────┐
│  Pacientes                  [+ Novo Paciente]       │
├─────────────────────────────────────────────────────┤
│  [🔍 Buscar por nome ou CPF]                        │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐   │
│  │ [A] Ana Paula          Ativo                 │   │
│  │     Por Sessão · Última sessão: 10/04        │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ [M] Maria Santos       Ativo                 │   │
│  │     Mensal · Valor: R$ 150,00                │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Comportamento:**
- Busca client-side por nome ou CPF
- Avatar com inicial do nome
- Badge de status (Ativo / Inativo)
- Clique na linha → vai para `/patients/{id}`

---

### Cadastrar Paciente — `/patients/new`

Formulário extenso dividido em seções.

**Seções:**
1. **Dados Pessoais** — Nome*, Data de Nascimento*, CPF, Telefone, Email
2. **Endereço** — CEP, Logradouro, Número, Complemento, Bairro, Cidade, Estado
3. **Pagamento** — Ciclo (Por Sessão / Quinzenal / Mensal / Semanal), Dia de pagamento (texto livre), Valor padrão por sessão
4. **Responsável Legal** — toggle para ativar; se ativo: Nome*, Telefone*, Email, CPF, Endereço

**Comportamento:**
- Dia de pagamento e valor padrão aparecem apenas quando ciclo ≠ Por Sessão
- Campos de responsável aparecem apenas quando toggle está ativo
- Validações: nome e data de nascimento obrigatórios

---

### Prontuário do Paciente — `/patients/{id}`

Página central de informações de um paciente. Layout em duas colunas.

**Coluna esquerda (dados fixos):**
```
┌─────────────────────────┐
│ 👤 Dados Pessoais       │
│   Nascimento, CPF       │
│   Email, Telefone       │
├─────────────────────────┤
│ 📍 Endereço             │
│   (se informado)        │
├─────────────────────────┤
│ 💰 Pagamento            │
│   Ciclo, Dia, Valor     │
├─────────────────────────┤
│ [+ Nova Anamnese]       │
├─────────────────────────┤
│ 🛡️ Responsável Legal    │
│   (se houver)           │
└─────────────────────────┘
```

**Coluna direita (histórico clínico):**
```
┌───────────────────────────────────────┐
│ ⚡ Protocolos Ativos                  │
│   [barra de progresso por protocolo]  │
├───────────────────────────────────────┤
│ 📋 Histórico de Evoluções (timeline) │
│   [card por sessão com data,          │
│    procedimentos, EVA, notas,         │
│    plano próxima sessão]              │
├───────────────────────────────────────┤
│ 📄 Avaliações e Anamneses            │
│   [alerta se última > 90 dias]        │
│   [card por avaliação com tipo,       │
│    data, queixa principal]            │
├───────────────────────────────────────┤
│ ✅ Protocolos Encerrados              │
├───────────────────────────────────────┤
│ 📎 Anexos                            │
│   [lista de arquivos com             │
│    download e exclusão]              │
└───────────────────────────────────────┘
```

**Header:**
- Nome + badge Ativo/Inativo
- Botões: [Editar] [Inativar] — inativar abre Dialog de confirmação

---

### Editar Paciente — `/patients/{id}/edit`

Mesmo formulário do cadastro, pré-preenchido com dados atuais.

---

### Nova Evolução — `/patients/{id}/evolutions/new`

**Campos:**
- Procedimentos realizados* (textarea)
- Técnicas aplicadas (textarea)
- Escala de dor EVA — slider visual 0–10 com cores (verde→amarelo→vermelho)
- Notas clínicas* (textarea)
- Plano para próxima sessão (textarea)

---

### Nova Avaliação — `/patients/{id}/assessments/new`

**Campos:**
- Tipo: Avaliação Inicial / Reavaliação Trimestral / Alta Clínica
- Data da avaliação
- Formulário de anamnese com perguntas estruturadas:
  - Queixa principal
  - Local da dor
  - Atividade física
  - Qualidade do sono
  - ... (salvo como JSON)
- Observações gerais

---

### Detalhes de Avaliação — `/patients/{id}/assessments/{assessmentId}`

Exibe todas as respostas da anamnese formatadas, com badge do tipo e data.

---

### Protocolos — `/patients/{id}/protocols`

Lista visual de todos os protocolos do paciente.

**Visual por protocolo:**
```
┌─────────────────────────────────────────────────────┐
│  Reabilitação Joelho         [Ativo]                │
│  Ciclo 2 de 3 · 10 sessões por ciclo               │
│                                                     │
│  Progresso total ──────────────── 46%              │
│                                                     │
│  [Ciclo 1 ✓]  [Ciclo 2 — atual]  [Ciclo 3]         │
│   ●●●●●●●●●●   ●●●●○○○○○○        ○○○○○○○○○○       │
│               4/10 sessões                          │
│                                                     │
│  [Completar Sessão]  [Encerrar]                     │
└─────────────────────────────────────────────────────┘
```

**Comportamento:**
- Ciclos completos: fundo verde suave com `✓`
- Ciclo atual: destaque com borda
- Ciclos futuros: cinza
- Bolinhas verdes = sessões completas, cinza = pendentes
- "Encerrar" abre Dialog de confirmação (warning)
- Protocolo encerrado: mostra badge "Encerrado", sem botões de ação

---

### Novo Protocolo — `/patients/{id}/protocols/new`

**Campos:**
- Nome do tratamento*
- Total de ciclos*
- Sessões por ciclo*

---

### Financeiro — `/payments`

Duas abas: **Pendentes** e **Histórico**.

**Aba Pendentes:**
```
┌─────────────────────────────────────────────────────┐
│  [card por paciente]                                │
│  👤 Maria Santos                                    │
│     Mensal · dia 5                                  │
│                                                     │
│  Sessões: 4    Total: R$ 600,00                     │
│                                                     │
│  Forma: [select Pix/Dinheiro/Cartão]               │
│         [Marcar Pago]                               │
└─────────────────────────────────────────────────────┘
```
- Agrupa todas as sessões pendentes de um paciente
- Um clique em "Marcar Pago" quita todas de uma vez

**Aba Histórico:**
```
┌─────────────────────────────────────────────────────┐
│  Receita Total: R$ 3.200,00   [Filtrar por mês ▼]  │
├─────────────────────────────────────────────────────┤
│  ABR 2026  ─────────────────────  R$ 1.800,00      │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🕐 Maria Santos  10/04 · 14h  Pix   R$150   │  │
│  │ 🕐 João Silva    08/04 · 10h  Cartão R$200   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  MAR 2026  ─────────────────────  R$ 1.400,00      │
└─────────────────────────────────────────────────────┘
```
- Agrupado por mês com total do mês
- Filtro por mês
- Badge colorido por forma de pagamento (verde=Pix, amarelo=Dinheiro, azul=Cartão)

---

### Prontuários — `/records`

Busca rápida por paciente com visão de histórico clínico.

**Visual:**
```
┌─────────────────────────────────────────────────────┐
│  Prontuários                                        │
│  [🔍 Buscar paciente...]                            │
├─────────────────────────────────────────────────────┤
│  [A] Ana Paula    Ativo                             │
│      📊 Evoluções: 12  🕐 Última: 10/04            │
│      📝 "Paciente relatou melhora signific..."      │
├─────────────────────────────────────────────────────┤
│  [M] Maria Santos  Ativo                            │
│      📊 Evoluções: 7   🕐 Última: 08/04            │
│      📝 "Exercícios de fortalecimento apli..."      │
└─────────────────────────────────────────────────────┘
```

**Comportamento:**
- Mostra todos os pacientes com total de evoluções e data/trecho da última
- Clique vai para `/patients/{id}` (prontuário completo)

---

### Configurações — `/settings`

Perfil do fisioterapeuta.

**Campos editáveis:**
- Nome completo
- Telefone
- CPF
- CREFITO

**Campo somente leitura:**
- Email (não pode ser alterado)

**Comportamento:**
- Atualiza o nome exibido na Sidebar imediatamente após salvar
- Feedback visual de sucesso/erro

---

## Componentes Compartilhados

### Sidebar — `components/Sidebar.tsx`

Menu lateral fixo (largura 256px) presente em todas as telas autenticadas.

**Itens de navegação:**
| Ícone        | Label         | Rota         |
|--------------|---------------|--------------|
| LayoutDashboard | Dashboard  | /dashboard   |
| Calendar     | Agenda        | /schedule    |
| Users        | Pacientes     | /patients    |
| FileText     | Prontuários   | /records     |
| DollarSign   | Financeiro    | /payments    |
| Settings     | Configurações | /settings    |

**Footer da Sidebar:**
- Avatar com inicial do nome do fisioterapeuta
- Nome e email
- Botão de logout (limpa localStorage + cookie + redireciona para /login)

---

### Dialog — `components/Dialog.tsx`

Modal reutilizável para confirmações e alertas. Substitui `window.alert()` e `window.confirm()` do browser.

**Props:**
```typescript
{
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string   // padrão: "Confirmar"
  cancelLabel?: string    // padrão: "Cancelar"
  variant?: "default" | "warning" | "danger"
  onConfirm: () => void
  onCancel?: () => void   // omitir = modo alerta (só botão OK)
}
```

**Variantes visuais:**
- `default` — botão teal (brand-primary)
- `warning` — botão âmbar (ações reversíveis como encerrar protocolo)
- `danger` — botão vermelho (ações destrutivas como excluir arquivo)

**z-index:** 60 (acima do modal de agenda que usa z-50)

---

## Autenticação e API

### `lib/api.ts` — apiFetch

Wrapper sobre `fetch` com:

- **Token automático:** lê `physioflow_token` do `localStorage` e injeta no header `Authorization: Bearer`
- **Content-Type JSON** automático
- **Timeout de 15 segundos** via `AbortController`
- **Tratamento de 401:** limpa localStorage + cookie `physioflow_token` + redireciona para `/login`
- **Erros com mensagem:** extrai `message` do JSON de erro quando disponível

```typescript
// Uso básico
const data = await apiFetch("/patients");

// Com body
const result = await apiFetch("/appointments", {
  method: "POST",
  body: JSON.stringify({ patientId, startDateTime, ... }),
});
```

### Fluxo de autenticação

```
1. POST /api/auth/login
   → recebe { accessToken }
   → salva em localStorage("physioflow_token")
   → salva dados do usuário em localStorage("physioflow_user")

2. Todas as requisições seguintes:
   → apiFetch injeta "Authorization: Bearer <token>" automaticamente

3. Resposta 401 em qualquer endpoint:
   → apiFetch limpa localStorage e cookie
   → redireciona para /login

4. Logout manual (botão na Sidebar):
   → remove localStorage("physioflow_token")
   → remove localStorage("physioflow_user")
   → remove cookie("physioflow_token")
   → router.push("/login")
```
