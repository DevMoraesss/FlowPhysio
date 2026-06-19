# PhysioFlow — Documento Completo do Sistema

> Documento gerado para análise de requisitos do TCC.
> Cobre backend, frontend, banco de dados e infraestrutura.

---

## 1. CONTEXTO DO PROJETO

**Nome:** PhysioFlow  
**Tipo:** Sistema web de gestão clínica para fisioterapeuta autônoma  
**Cliente real:** Dra. Priscila (fisioterapeuta)  
**Finalidade:** TCC — desenvolver e documentar um sistema funcional que resolve problemas reais da cliente  
**Desenvolvedor:** Juan Moraes  

**Problema resolvido:**
A Dra. Priscila gerenciava pacientes, sessões e cobranças de forma manual (papel, planilha, WhatsApp). O PhysioFlow centraliza toda a gestão clínica e financeira em um único sistema web.

---

## 2. STACK TECNOLÓGICA

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| ASP.NET Core | 9 | Framework web / API REST |
| Entity Framework Core | 9 | ORM — mapeamento objeto-relacional |
| PostgreSQL | 16 | Banco de dados relacional |
| BCrypt.Net | — | Hash de senhas |
| JWT Bearer | — | Autenticação stateless (tokens 24h) |

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 15 (App Router) | Framework React com SSR/CSR |
| TypeScript | — | Tipagem estática |
| TailwindCSS | — | Estilização utilitária |
| FullCalendar | — | Calendário interativo de agendamentos |
| Lucide React | — | Biblioteca de ícones |

### Infraestrutura
| Tecnologia | Uso |
|---|---|
| Docker + Docker Compose | Banco de dados local em container |
| PostgreSQL 16 Alpine | Banco em container (porta 5433) |

---

## 3. ARQUITETURA

### Padrão: Clean Architecture (3 camadas)

```
src/
├── PhysioFlow.Domain/
│   ├── Entities/          ← classes de domínio (puras, sem dependência externa)
│   ├── Enums/             ← enumerações do domínio
│   └── Interfaces/        ← contratos dos repositórios (IPatientRepository, etc.)
│
├── PhysioFlow.Infrastructure/
│   ├── Data/              ← PhysioFlowDbContext (EF Core)
│   ├── Repositories/      ← implementações concretas dos repositórios
│   └── Migrations/        ← histórico de migrations do banco
│
└── PhysioFlow.Api/
    ├── Controllers/       ← endpoints HTTP (um por recurso)
    ├── DTOs/              ← objetos de entrada (Request) e saída (Response)
    └── Services/          ← AuthService (JWT + BCrypt)
```

**Regra de dependência:**
- `Domain` → não depende de nada
- `Infrastructure` → depende de `Domain`
- `Api` → depende de `Domain` e `Infrastructure`

### Frontend: Next.js App Router

```
PhysioFlow-web/
├── app/                   ← rotas (cada pasta = rota)
├── components/            ← Sidebar, Dialog
└── lib/
    └── api.ts             ← apiFetch (wrapper JWT + timeout + 401)
```

---

## 4. BANCO DE DADOS

### Infraestrutura

- **SGBD:** PostgreSQL 16
- **Porta local:** 5433 (mapeada do container)
- **Database dev:** `PhysioFlow_dev`
- **ORM:** Entity Framework Core com Migrations
- **Versionamento:** todas as mudanças de schema via migrations rastreadas no git

### Diagrama de Relacionamentos

```
User (Fisioterapeuta)
 └─── Patient [1:N]
       ├─── Guardian [N:0..1]     ← responsável legal
       ├─── Appointment [1:N]
       │     └─── Evolution [1:0..1]
       ├─── Assessment [1:N]      ← anamneses e avaliações
       ├─── Protocol [1:N]
       │     └─── Appointment [1:N]  ← sessões vinculadas
       └─── Attachment [1:N]      ← arquivos e exames
```

---

### Tabelas e Campos

#### `Users` (Fisioterapeuta — usuário do sistema)
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Id | uuid | sim | PK |
| FullName | varchar | sim | |
| Email | varchar | sim | único, usado para login |
| PasswordHash | varchar | sim | BCrypt |
| Phone | varchar | não | |
| Cpf | varchar | não | |
| Crefito | varchar | não | registro profissional |
| CreatedAt | timestamp | sim | automático |

#### `Patients` (Paciente)
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Id | uuid | sim | PK |
| PhysioId | uuid | sim | FK → Users |
| GuardianId | uuid | não | FK → Guardians |
| FullName | varchar | sim | |
| BirthDate | date | sim | |
| Cpf | varchar | não | normalizado internamente (só dígitos) |
| Phone | varchar | não | |
| Email | varchar | não | |
| ZipCode | varchar | não | |
| Street | varchar | não | |
| Number | varchar | não | |
| Complement | varchar | não | |
| Neighborhood | varchar | não | |
| City | varchar | não | |
| State | varchar | não | |
| IsActive | boolean | sim | default true — soft delete |
| PaymentCycle | int | sim | 1=PorSessão, 2=Quinzenal, 3=Mensal, 4=Semanal |
| PaymentDay | varchar | não | texto livre: "dia 5", "toda sexta" |
| DefaultSessionValue | decimal | não | valor pré-preenchido no agendamento |
| CreatedAt | timestamp | sim | automático |

#### `Guardians` (Responsável Legal)
| Campo | Tipo | Obrigatório |
|---|---|---|
| Id | uuid | sim |
| FullName | varchar | sim |
| Phone | varchar | sim |
| Email | varchar | não |
| Cpf | varchar | não |
| ZipCode | varchar | sim |
| Street–State | varchar | não |
| CreatedAt | timestamp | sim |

#### `Appointments` (Agendamento / Sessão)
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Id | uuid | sim | PK |
| PatientId | uuid | sim | FK → Patients |
| PhysioId | uuid | sim | FK → Users |
| ProtocolId | uuid | não | FK → Protocols (opcional) |
| StartDateTime | timestamp | sim | UTC |
| EndDateTime | timestamp | sim | UTC |
| Status | int | sim | 1=Agendada, 2=Concluída, 3=Falta, 4=Cancelada |
| PaymentStatus | int | sim | 1=Pendente, 2=Pago, 3=Dispensado |
| PaymentMethod | int | não | 1=Pix, 2=Dinheiro, 3=Cartão |
| SessionValue | decimal | sim | |
| RequiresReceipt | boolean | sim | default false |
| Notes | varchar | não | observações |
| CreatedAt | timestamp | sim | |

#### `Evolutions` (Evolução Clínica)
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Id | uuid | sim | PK |
| AppointmentId | uuid | sim | FK → Appointments (deve estar Concluída) |
| PatientId | uuid | sim | FK → Patients |
| ProceduresPerformed | text | sim | procedimentos realizados |
| TechniquesApplied | text | não | técnicas aplicadas |
| PainScale | int | não | EVA 0–10 |
| ClinicalNotes | text | sim | anotações clínicas |
| NextSessionPlan | text | não | plano da próxima sessão |
| CreatedAt | timestamp | sim | |

#### `Assessments` (Avaliação / Anamnese)
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Id | uuid | sim | PK |
| PatientId | uuid | sim | FK → Patients |
| Type | int | sim | 1=Inicial, 2=ReavaliaçãoTrimestral, 3=AltaClínica |
| AssessmentDate | timestamp | sim | |
| AnamnesisAnswers | text | sim | JSON com respostas do formulário |
| GeneralNotes | text | não | anotações livres |
| CreatedAt | timestamp | sim | |

**Regras de negócio:**
- `Inicial (1)`: só permitida se o paciente ainda não tem nenhuma avaliação
- `Reavaliação (2)`: só permitida se última avaliação foi há ≥ 90 dias; exige uma Inicial prévia
- `Alta (3)`: sem restrição de prazo

#### `Protocols` (Protocolo de Tratamento)
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Id | uuid | sim | PK |
| PatientId | uuid | sim | FK → Patients |
| TreatmentName | varchar | sim | nome do tratamento |
| TotalCycles | int | sim | quantidade de ciclos |
| SessionsPerCycle | int | sim | sessões por ciclo |
| CurrentCycle | int | sim | default 1 |
| CompletedSessions | int | sim | default 0 |
| IsActive | boolean | sim | default true |
| CreatedAt | timestamp | sim | |

**Progressão automática:** ao concluir sessão vinculada ao protocolo → `CompletedSessions++`. Ao atingir `SessionsPerCycle` → `CurrentCycle++`, `CompletedSessions = 0`. Ao concluir todos os ciclos → `IsActive = false`.

#### `Attachments` (Anexos)
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Id | uuid | sim | PK |
| PatientId | uuid | não | FK → Patients |
| AssessmentId | uuid | não | FK → Assessments |
| EvolutionId | uuid | não | FK → Evolutions |
| FileName | varchar | sim | nome original do arquivo |
| FilePath | varchar | sim | caminho no servidor |
| ContentType | varchar | sim | MIME type |
| FileSize | bigint | sim | bytes |
| CreatedAt | timestamp | sim | |

---

## 5. SEGURANÇA E AUTENTICAÇÃO

- **JWT Bearer Token** com expiração de **24 horas**
- Senha armazenada com **BCrypt** (nunca texto puro)
- **Multitenancy simples:** todo endpoint extrai o `PhysioId` do token JWT — fisioterapeuta só acessa seus próprios dados
- **Verificação de ownership:** `GetById`, `Update`, `Delete` verificam se o recurso pertence ao usuário autenticado antes de responder
- **Token armazenado** no frontend em `localStorage` + cookie
- **401 automático:** `apiFetch` detecta 401, limpa storage e redireciona para `/login`
- **Timeout de 15s** em todas as requisições (AbortController)
- **CORS** configurado via `appsettings.json` → `AllowedOrigins` (lista separada por vírgula)

---

## 6. BACKEND — ENDPOINTS COMPLETOS

> Todas as rotas abaixo exigem `Authorization: Bearer <token>`, exceto `/api/auth/*`

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | /api/auth/register | Criar conta de fisioterapeuta |
| POST | /api/auth/login | Login → retorna `{ accessToken }` |

### Usuário (Perfil)
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/users/me | Dados do fisioterapeuta logado |
| PUT | /api/users/me | Atualizar nome, telefone, CPF, CREFITO |

### Pacientes
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/patients | Listar pacientes ativos do fisioterapeuta |
| GET | /api/patients/{id} | Buscar paciente por ID |
| POST | /api/patients | Criar paciente |
| PUT | /api/patients/{id} | Atualizar dados do paciente |
| PATCH | /api/patients/{id}/deactivate | Inativar paciente (soft delete) |

**Validações especiais:**
- CPF normalizado (remove pontos/traço) para comparação de duplicidade
- Não cria agendamento para paciente inativo

### Responsáveis Legais
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/guardians/{id} | Buscar responsável por ID |
| POST | /api/guardians | Criar responsável legal |

### Agendamentos
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/appointments | Todos os agendamentos do fisioterapeuta |
| GET | /api/appointments/{id} | Buscar por ID |
| GET | /api/appointments/range?start=&end= | Por período (usado pelo calendário) |
| GET | /api/appointments/patient/{patientId} | Agendamentos de um paciente |
| GET | /api/appointments/pending-payments | Sessões concluídas com pagamento pendente (agrupadas por paciente) |
| POST | /api/appointments | Criar agendamento |
| PUT | /api/appointments/{id} | Atualizar status, pagamento, horário |
| PATCH | /api/appointments/batch-pay | Marcar múltiplos como pagos de uma vez |

**Validações especiais:**
- Verifica conflito de horário ao criar e ao editar
- Ao concluir (status=2): `PaymentStatus` obrigatório
- Progressão automática de protocolo ao concluir sessão vinculada

### Evoluções Clínicas
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/evolutions/patient/{patientId} | Histórico de evoluções do paciente |
| GET | /api/evolutions/appointment/{appointmentId} | Evolução de um agendamento |
| GET | /api/evolutions/{id} | Buscar por ID |
| POST | /api/evolutions | Registrar evolução (sessão deve estar Concluída) |
| PUT | /api/evolutions/{id} | Atualizar evolução |

### Avaliações / Anamneses
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/assessments/patient/{patientId} | Avaliações do paciente |
| GET | /api/assessments/{id} | Buscar por ID |
| POST | /api/assessments | Registrar avaliação (com regras de prazo) |
| PUT | /api/assessments/{id} | Atualizar respostas e observações |

**Regras de prazo (implementadas no backend):**
- Inicial: bloqueado se já existe avaliação para o paciente
- Reavaliação: bloqueado se < 90 dias desde a última avaliação
- Alta: sem restrição

### Protocolos
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/protocols/patient/{patientId} | Todos os protocolos do paciente |
| GET | /api/protocols/patient/{patientId}/active | Apenas ativos |
| GET | /api/protocols/{id} | Buscar por ID |
| POST | /api/protocols | Criar protocolo |
| PUT | /api/protocols/{id} | Atualizar / encerrar (isActive=false) |
| PATCH | /api/protocols/{id}/complete-session | Registrar sessão manualmente |

### Dashboard
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/dashboard | Resumo do dia: totais, receita, lista de sessões |
| GET | /api/dashboard/no-shows | Pacientes que faltaram e não remarcaram |

### Anexos
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/attachments/patient/{patientId} | Listar anexos do paciente |
| GET | /api/attachments/{id}/download | Download do arquivo |
| POST | /api/attachments | Upload (multipart/form-data) |
| DELETE | /api/attachments/{id} | Deletar anexo |

---

## 7. FRONTEND — PÁGINAS COMPLETAS

### Estrutura de rotas

```
/login                                   ← autenticação
/register                                ← cadastro de fisioterapeuta
/dashboard                               ← painel do dia
/schedule                                ← agenda (FullCalendar)
/schedule/new                            ← novo agendamento
/patients                                ← lista de pacientes
/patients/new                            ← cadastrar paciente
/patients/[id]                           ← prontuário completo
/patients/[id]/edit                      ← editar paciente
/patients/[id]/assessments/new           ← nova avaliação/anamnese
/patients/[id]/assessments/[assessmentId]← detalhes de avaliação
/patients/[id]/evolutions/new            ← nova evolução clínica
/patients/[id]/protocols                 ← protocolos do paciente
/patients/[id]/protocols/new             ← novo protocolo
/payments                                ← financeiro (pendentes + histórico)
/records                                 ← prontuários — busca rápida
/settings                                ← perfil do fisioterapeuta
```

---

### `/login` — Login
- Campos: Email, Senha
- Token salvo em `localStorage` + cookie após login
- Redireciona para `/dashboard`

### `/register` — Cadastro
- Campos: Nome completo, Email, Senha, CREFITO (opcional)
- Após cadastro → redireciona para `/login`

### `/dashboard` — Painel do Dia
**Cards de métricas:**
- Total de agendamentos do dia
- Sessões concluídas
- Faltas + cancelamentos
- Receita do dia (sessões pagas)

**Seções:**
- Ações rápidas: "Novo Agendamento" e "Cadastrar Paciente"
- Agenda de hoje: lista de sessões com horário e badge de status, link para o prontuário
- Alertas: pacientes que faltaram e não remarcaram, com botão "Remarcar" (vai para `/schedule/new?patientId=...`)

### `/schedule` — Agenda (FullCalendar)
**Visualizações:** Semana (padrão), Mês, Dia  
**Cores por status:**
- Azul claro = Agendada
- Verde = Concluída
- Vermelho = Falta
- Cinza = Cancelada

**Modal ao clicar no evento:**
- Exibe: paciente, data, horário, valor
- Se status = Agendada:
  - Paciente "Por Sessão": botão "Concluir Sessão" → abre select de forma de pagamento (Pix / Dinheiro / Cartão / Pagar depois)
  - Paciente Quinzenal/Mensal/Semanal: aviso "pagamento será cobrado depois" + botão "Concluir Sessão" direto
  - Botões "Falta" e "Cancelar"
- Se status ≠ Agendada: badge com status final + botão Fechar

### `/schedule/new` — Novo Agendamento
- Select de paciente com busca por nome
- Ao selecionar: mostra ciclo de pagamento e valor padrão do paciente
- Campos: data (pré-preenchida via `?date=`), hora início/fim, valor da sessão, observações
- Paciente pode ser pré-selecionado via `?patientId=` (vindo do botão "Remarcar")
- Se ciclo ≠ Por Sessão: badge informativo sobre cobrança posterior
- Se ciclo = Por Sessão: select de forma de pagamento na criação

### `/patients` — Lista de Pacientes
- Busca client-side por nome ou CPF
- Card por paciente: avatar com inicial, nome, badge Ativo/Inativo, ciclo de pagamento, último agendamento
- Clique → vai para `/patients/{id}`

### `/patients/new` — Cadastrar Paciente
Seções:
1. Dados Pessoais: Nome*, Data Nasc.*, CPF, Telefone, Email
2. Endereço: CEP, Logradouro, Número, Complemento, Bairro, Cidade, Estado
3. Pagamento: Ciclo (Por Sessão/Quinzenal/Mensal/Semanal), Dia de Pagamento, Valor Padrão/sessão
4. Responsável Legal: toggle — ao ativar exibe campos de nome, telefone, CPF, email, endereço

### `/patients/[id]` — Prontuário Completo
**Banner de alerta (topo):** aparece se nenhuma avaliação existe ou se última foi há ≥ 90 dias. Clicável → leva para `/assessments/new`.

**Coluna esquerda:**
- Dados pessoais (nascimento, CPF, email, telefone)
- Endereço (se informado)
- Pagamento (ciclo, dia, valor padrão)
- Botão "Nova Anamnese"
- Responsável legal (se houver)

**Coluna direita:**
- Protocolos ativos com barra de progresso
- Histórico de evoluções em timeline (data, procedimentos, EVA, notas, plano)
- Avaliações/anamneses (alerta se > 90 dias, lista com tipo e data)
- Protocolos encerrados
- Anexos (lista com download e exclusão)

**Header:** botões Editar e Inativar (com Dialog de confirmação)

### `/patients/[id]/edit` — Editar Paciente
Mesmo formulário do cadastro, pré-preenchido.

### `/patients/[id]/assessments/new` — Nova Avaliação
**Toggle:** Adulto/Ortopédico ou Pediátrico/Neurológico  
**Tipos disponíveis:** Avaliação Inicial, Reavaliação Trimestral, Alta Clínica  

**Bloqueio automático (frontend + backend):**
- Se selecionar "Inicial" e já existe uma → banner laranja "Avaliação bloqueada" + botão desativado
- Se selecionar "Reavaliação" sem ter Inicial → bloqueado
- Se selecionar "Reavaliação" e última foi < 90 dias → bloqueado com contador de dias restantes

**Formulário Adulto/Ortopédico:** queixa principal*, diagnóstico médico, médico responsável, histórico da doença, EVA (slider 0–10), localização da dor, ocupação, fatores agravantes/melhora, atividade física, qualidade do sono, cirurgias anteriores, medicamentos, alergias, histórico familiar

**Formulário Pediátrico/Neurológico:** queixa principal*, diagnóstico médico, médico responsável, medicamentos, data corrigida (prematuros), marcos do desenvolvimento motor (rolou, sentou com apoio, sentou sem apoio, engatinhou, em pé sem apoio, andou), AVD (alimentação, banho, fralda, sono), avaliação motora (tônus, coordenação grossa/fina, equilíbrio, habilidades)

**Campo comum:** Observações Gerais (texto livre para informações que não se encaixam)

### `/patients/[id]/assessments/[assessmentId]` — Detalhes da Avaliação
- Exibe todas as respostas da anamnese formatadas
- Badge de tipo (Inicial / Reavaliação / Alta)
- Data da avaliação

### `/patients/[id]/evolutions/new` — Nova Evolução
Campos:
- Procedimentos realizados* (textarea)
- Técnicas aplicadas (textarea)
- EVA — slider 0–10 com cores (verde → amarelo → vermelho)
- Notas clínicas* (textarea)
- Plano para próxima sessão (textarea)

### `/patients/[id]/protocols` — Protocolos
Por protocolo:
- Nome + badge Ativo/Encerrado
- Texto: "Ciclo X de Y · N sessões por ciclo"
- Barra de progresso total em %
- Ciclos visuais: completos (verde + ✓), atual (destaque), futuros (cinza)
- Bolinhas por sessão: verde = concluída, cinza = pendente
- Botões (só quando ativo): "Completar Sessão" e "Encerrar" (com Dialog de confirmação)

### `/patients/[id]/protocols/new` — Novo Protocolo
Campos: Nome do tratamento*, Total de ciclos*, Sessões por ciclo*

### `/payments` — Financeiro

**Aba Pendentes:**
- Card por paciente com: nome, ciclo de pagamento, dia de pagamento, total de sessões pendentes, valor total
- Select de forma de pagamento + botão "Marcar Pago" (quita todas as sessões do paciente de uma vez)

**Aba Histórico:**
- Receita total registrada no topo
- Filtro por mês
- Agrupado por mês com total do mês
- Por sessão: nome do paciente, data/hora, forma de pagamento (badge colorido), valor

### `/records` — Prontuários
- Busca por nome de paciente
- Card por paciente: avatar com inicial, status, total de evoluções, data da última sessão, trecho da última anotação
- Clique → vai para `/patients/{id}`

### `/settings` — Configurações
- Campos editáveis: nome, telefone, CPF, CREFITO
- Campo somente leitura: email
- Atualiza nome na Sidebar imediatamente após salvar

---

## 8. REGRAS DE NEGÓCIO IMPLEMENTADAS

| Regra | Onde implementado |
|---|---|
| Fisioterapeuta só vê seus próprios dados | Backend — ownership check em todo endpoint |
| Senha nunca salva em texto puro | BCrypt no AuthService |
| Token expira em 24h | JWT com `expires_in` |
| 401 → redireciona para login | apiFetch (frontend) |
| Conflito de horário bloqueado | AppointmentsController.Create e Update |
| Não agenda paciente inativo | AppointmentsController.Create |
| Ao concluir sessão, PaymentStatus obrigatório | AppointmentsController.Update |
| Paciente Por Sessão → paga na hora | Lógica no modal da agenda (frontend) |
| Paciente Quinzenal/Mensal/Semanal → pagamento pendente | Lógica no modal e no backend |
| Batch pay → quitação em lote por paciente | PATCH /appointments/batch-pay |
| Protocolo avança ciclo automaticamente ao concluir sessão | AppointmentsController.Update |
| Protocolo encerra ao completar todos os ciclos | AppointmentsController.Update |
| Avaliação Inicial bloqueada se já existe uma | AssessmentsController.Create |
| Reavaliação bloqueada se < 90 dias desde a última | AssessmentsController.Create |
| Alerta visual no prontuário se reavaliação pendente | patients/[id]/page.tsx |
| CPF normalizado (remove máscara) para comparação | PatientsController |
| Soft delete de paciente (histórico preservado) | PATCH /patients/{id}/deactivate |

---

## 9. COMPONENTES COMPARTILHADOS (Frontend)

### Sidebar
- Menu lateral fixo (256px)
- Itens: Dashboard, Agenda, Pacientes, Prontuários, Financeiro, Configurações
- Footer: avatar com inicial do fisioterapeuta, nome, email, botão logout

### Dialog (modal reutilizável)
Substitui `window.alert()` e `window.confirm()` nativos do browser.
- Props: `title`, `message`, `confirmLabel`, `cancelLabel`, `variant`, `onConfirm`, `onCancel`
- Variantes: `default` (teal), `warning` (âmbar), `danger` (vermelho)
- Sem `onCancel` → modo alerta (só botão OK)
- z-index 60 (acima de outros modais)
- Usado em: inativar paciente, excluir anexo, encerrar protocolo, erros de API

---

## 10. O QUE NÃO ESTÁ IMPLEMENTADO (lacunas conhecidas)

| Funcionalidade | Status |
|---|---|
| Editar avaliação (frontend) | Backend tem PUT, frontend não tem tela de edição |
| Excluir evolução | Não implementado (sem DELETE no backend) |
| Excluir avaliação | Não implementado (sem DELETE no backend) |
| Exportar prontuário em PDF | Não implementado |
| Relatórios financeiros por período/forma de pagamento | Não implementado |
| Notificação por WhatsApp/email/push | Não implementado |
| Editar evolução (frontend) | Backend tem PUT, sem tela de edição |
| Reativar paciente inativo (frontend) | Backend suporta via PUT, sem botão na tela |
| Alterar senha | Não implementado |
| Configurações visuais (tema, preferências) | Não implementado |

---

## 11. INFRAESTRUTURA — AMBIENTES

### Desenvolvimento Local
```yaml
# docker-compose.local.yaml
# PostgreSQL no Docker, API e Frontend rodam localmente
PostgreSQL 16 Alpine
  porta: 5433 (local) ← 5432 (container)
  database: PhysioFlow_dev
  user/password: postgres/postgres
```

**URLs locais:**
- Frontend: `http://localhost:3000`
- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/swagger`

### Produção (estrutura preparada)
- `appsettings.Production.json` no `.gitignore` (não sobe para o repositório)
- Variáveis sensíveis: ConnectionString, JWT Secret, AllowedOrigins

---

## 12. COMO RODAR LOCALMENTE

```bash
# 1. Banco de dados
docker-compose -f docker-compose.local.yaml up -d

# 2. Migrations
dotnet ef database update \
  --project src/PhysioFlow.Infrastructure \
  --startup-project src/PhysioFlow.Api

# 3. API
dotnet run --project src/PhysioFlow.Api

# 4. Frontend (outro terminal)
cd PhysioFlow-web
npm install
npm run dev
```

---

*Documento gerado em 2026 — PhysioFlow / Juan Moraes*
