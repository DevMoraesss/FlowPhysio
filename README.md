# PhysioFlow

Sistema de gestão clínica para fisioterapeutas — desenvolvido como TCC (Trabalho de Conclusão de Curso).

**Stack:** ASP.NET Core 9 · PostgreSQL · Next.js 15 · TypeScript · TailwindCSS

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Modelo de Dados](#modelo-de-dados)
4. [Como Rodar Localmente](#como-rodar-localmente)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Endpoints da API](#endpoints-da-api)
7. [Exemplos com cURL](#exemplos-com-curl)
8. [Comandos Úteis](#comandos-úteis)

---

## Visão Geral

O PhysioFlow foi desenvolvido para atender à demanda de gestão clínica de uma fisioterapeuta autônoma. O sistema centraliza:

- Cadastro e prontuário de pacientes
- Agenda de sessões com calendário visual
- Registro de evoluções clínicas
- Avaliações e anamneses estruturadas
- Protocolos de tratamento com controle de ciclos
- Controle financeiro (pagamentos por sessão, quinzenal, mensal ou semanal)
- Upload de anexos (exames, laudos, documentos)
- Dashboard com visão do dia e alertas

O sistema é **multiusuário**: cada fisioterapeuta cadastrado vê apenas seus próprios dados. Toda autenticação usa JWT com expiração de 24h.

---

## Arquitetura

Segue **Clean Architecture** com separação em três camadas:

```
src/
├── PhysioFlow.Domain/          # Entidades, enums, interfaces de repositório
│   ├── Entities/               # Patient, Appointment, Evolution, etc.
│   ├── Enums/                  # AppointmentStatus, PaymentCycle, etc.
│   └── Interfaces/             # IPatientRepository, IAppointmentRepository, etc.
│
├── PhysioFlow.Infrastructure/  # Implementação de repositórios, EF Core, migrations
│   ├── Data/                   # PhysioFlowDbContext
│   ├── Repositories/           # Implementações concretas dos repositórios
│   └── Migrations/             # Histórico de migrations do banco
│
└── PhysioFlow.Api/             # Controllers, DTOs, serviços, configuração
    ├── Controllers/            # Um controller por recurso
    ├── DTOs/                   # Request/Response de cada endpoint
    └── Services/               # AuthService (JWT + BCrypt)

PhysioFlow-web/                 # Frontend Next.js 15 (App Router)
```

**Regras de design:**
- `Domain` não depende de nada externo
- `Infrastructure` depende de `Domain`
- `Api` depende de `Domain` e `Infrastructure`
- Repositórios são injetados via interface (DI nativa do .NET)

---

## Modelo de Dados

### Diagrama de relacionamentos

```
User (Fisioterapeuta)
 └── Patient (N)
      ├── Guardian (0..1)       — responsável legal
      ├── Appointment (N)
      │    └── Evolution (0..1)
      ├── Assessment (N)        — anamnese / avaliação
      ├── Protocol (N)
      │    └── Appointment (N)  — sessões vinculadas ao protocolo
      └── Attachment (N)        — arquivos e exames
```

---

### User (Fisioterapeuta)

| Campo        | Tipo    | Obrigatório | Descrição                         |
|--------------|---------|-------------|-----------------------------------|
| Id           | Guid    | sim         | PK                                |
| FullName     | string  | sim         |                                   |
| Email        | string  | sim         | único, usado para login           |
| PasswordHash | string  | sim         | BCrypt                            |
| Phone        | string? | não         |                                   |
| Cpf          | string? | não         |                                   |
| Crefito      | string? | não         | número de registro profissional   |
| CreatedAt    | DateTime| sim         |                                   |

---

### Patient (Paciente)

| Campo               | Tipo         | Obrigatório | Descrição                                  |
|---------------------|--------------|-------------|--------------------------------------------|
| Id                  | Guid         | sim         | PK                                         |
| PhysioId            | Guid         | sim         | FK → User                                  |
| GuardianId          | Guid?        | não         | FK → Guardian (responsável legal)          |
| FullName            | string       | sim         |                                            |
| BirthDate           | DateOnly     | sim         |                                            |
| Cpf                 | string?      | não         | normalizado (só dígitos) na comparação     |
| Phone               | string?      | não         |                                            |
| Email               | string?      | não         |                                            |
| ZipCode             | string?      | não         |                                            |
| Street              | string?      | não         |                                            |
| Number              | string?      | não         |                                            |
| Complement          | string?      | não         |                                            |
| Neighborhood        | string?      | não         |                                            |
| City                | string?      | não         |                                            |
| State               | string?      | não         |                                            |
| IsActive            | bool         | sim         | soft delete — inativar não apaga dados     |
| PaymentCycle        | enum (int)   | sim         | 1=Por Sessão, 2=Quinzenal, 3=Mensal, 4=Semanal |
| PaymentDay          | string?      | não         | ex: "dia 5", "toda sexta"                  |
| DefaultSessionValue | decimal?     | não         | valor padrão pré-preenchido no agendamento |

---

### Guardian (Responsável Legal)

| Campo        | Tipo    | Obrigatório |
|--------------|---------|-------------|
| Id           | Guid    | sim         |
| FullName     | string  | sim         |
| Phone        | string  | sim         |
| Email        | string? | não         |
| Cpf          | string? | não         |
| ZipCode      | string  | sim         |
| Street       | string? | não         |
| Number       | string? | não         |
| Complement   | string? | não         |
| Neighborhood | string? | não         |
| City         | string? | não         |
| State        | string? | não         |

---

### Appointment (Agendamento / Sessão)

| Campo          | Tipo         | Obrigatório | Descrição                                      |
|----------------|--------------|-------------|------------------------------------------------|
| Id             | Guid         | sim         | PK                                             |
| PatientId      | Guid         | sim         | FK → Patient                                   |
| PhysioId       | Guid         | sim         | FK → User                                      |
| ProtocolId     | Guid?        | não         | FK → Protocol (opcional)                       |
| StartDateTime  | DateTime     | sim         | UTC                                            |
| EndDateTime    | DateTime     | sim         | UTC                                            |
| Status         | enum (int)   | sim         | 1=Agendada, 2=Concluída, 3=Falta, 4=Cancelada |
| PaymentStatus  | enum (int)   | sim         | 1=Pendente, 2=Pago, 3=Dispensado               |
| PaymentMethod  | enum (int)?  | não         | 1=Pix, 2=Dinheiro, 3=Cartão                    |
| SessionValue   | decimal      | sim         | valor cobrado nesta sessão                     |
| RequiresReceipt| bool         | sim         | paciente solicita recibo                       |
| Notes          | string?      | não         | observações gerais                             |

**Regra de negócio:** ao concluir (Status=2), o campo `PaymentStatus` é obrigatório. Se `PaymentCycle` do paciente for Quinzenal/Mensal/Semanal, o pagamento fica Pendente para cobrança posterior.

---

### Evolution (Evolução Clínica)

| Campo               | Tipo    | Obrigatório | Descrição                     |
|---------------------|---------|-------------|-------------------------------|
| Id                  | Guid    | sim         | PK                            |
| AppointmentId       | Guid    | sim         | FK → Appointment (Completed)  |
| PatientId           | Guid    | sim         | FK → Patient                  |
| ProceduresPerformed | string  | sim         | procedimentos realizados      |
| TechniquesApplied   | string? | não         | técnicas aplicadas            |
| PainScale           | int?    | não         | EVA 0–10                      |
| ClinicalNotes       | string  | sim         | anotações clínicas            |
| NextSessionPlan     | string? | não         | plano para próxima sessão     |

---

### Assessment (Avaliação / Anamnese)

| Campo             | Tipo      | Obrigatório | Descrição                                     |
|-------------------|-----------|-------------|-----------------------------------------------|
| Id                | Guid      | sim         | PK                                            |
| PatientId         | Guid      | sim         | FK → Patient                                  |
| Type              | enum (int)| sim         | 1=Inicial, 2=Reavaliação Trimestral, 3=Alta   |
| AssessmentDate    | DateTime  | sim         |                                               |
| AnamnesisAnswers  | string    | sim         | JSON com respostas do formulário              |
| GeneralNotes      | string?   | não         | observações gerais                            |

**Alerta automático:** quando a última avaliação tem mais de 90 dias, o sistema exibe aviso no prontuário.

---

### Protocol (Protocolo de Tratamento)

| Campo             | Tipo    | Obrigatório | Descrição                                    |
|-------------------|---------|-------------|----------------------------------------------|
| Id                | Guid    | sim         | PK                                           |
| PatientId         | Guid    | sim         | FK → Patient                                 |
| TreatmentName     | string  | sim         | nome do tratamento                           |
| TotalCycles       | int     | sim         | quantidade total de ciclos                   |
| SessionsPerCycle  | int     | sim         | sessões por ciclo                            |
| CurrentCycle      | int     | sim         | ciclo atual (começa em 1)                    |
| CompletedSessions | int     | sim         | sessões concluídas no ciclo atual            |
| IsActive          | bool    | sim         | protocolo ativo ou encerrado                 |

**Progressão automática:** ao concluir uma sessão vinculada ao protocolo, `CompletedSessions` avança. Ao atingir `SessionsPerCycle`, o ciclo avança. Ao concluir todos os ciclos, `IsActive` vai para `false`.

---

### Attachment (Anexo)

| Campo       | Tipo    | Obrigatório | Descrição                              |
|-------------|---------|-------------|----------------------------------------|
| Id          | Guid    | sim         | PK                                     |
| PatientId   | Guid?   | não         | FK → Patient                           |
| AssessmentId| Guid?   | não         | FK → Assessment                        |
| EvolutionId | Guid?   | não         | FK → Evolution                         |
| FileName    | string  | sim         | nome original do arquivo               |
| FilePath    | string  | sim         | caminho físico no servidor             |
| ContentType | string  | sim         | MIME type                              |
| FileSize    | long    | sim         | tamanho em bytes                       |

---

## Como Rodar Localmente

### Pré-requisitos

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [Node.js 18+](https://nodejs.org/)

### 1. Clone o repositório

```bash
git clone <url-do-repo>
cd PhysioFlow
```

### 2. Inicie o banco de dados

```bash
docker-compose -f docker-compose.local.yaml up -d
```

### 3. Aplique as migrations

```bash
dotnet ef database update \
  --project src/PhysioFlow.Infrastructure \
  --startup-project src/PhysioFlow.Api
```

### 4. Execute a API

```bash
dotnet run --project src/PhysioFlow.Api
```

API disponível em: `http://localhost:5000`
Swagger disponível em: `http://localhost:5000/swagger`

### 5. Execute o Frontend

```bash
cd PhysioFlow-web
npm install
npm run dev
```

Frontend disponível em: `http://localhost:3000`

---

## Variáveis de Ambiente

### Backend — `src/PhysioFlow.Api/appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5433;Database=PhysioFlow_dev;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Secret": "SuaChaveSecretaComPeloMenos32Caracteres!",
    "Issuer": "PhysioFlow",
    "Audience": "PhysioFlowUsers"
  },
  "AllowedOrigins": "http://localhost:3000,http://localhost:3001"
}
```

> Para produção, crie `appsettings.Production.json` (já no `.gitignore`) e sobrescreva os valores sensíveis.

### Frontend — `PhysioFlow-web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Endpoints da API

> Todas as rotas (exceto `/auth/*`) exigem o header: `Authorization: Bearer <token>`

### Autenticação

| Método | Endpoint            | Descrição                    | Auth |
|--------|---------------------|------------------------------|------|
| POST   | /api/auth/register  | Criar conta de fisioterapeuta | ❌   |
| POST   | /api/auth/login     | Login — retorna JWT (24h)    | ❌   |

**Resposta do login:**
```json
{ "accessToken": "eyJ..." }
```

---

### Usuário (Perfil)

| Método | Endpoint       | Descrição                         | Auth |
|--------|----------------|-----------------------------------|------|
| GET    | /api/users/me  | Dados do fisioterapeuta logado    | ✅   |
| PUT    | /api/users/me  | Atualizar nome, telefone, CPF, CREFITO | ✅ |

---

### Pacientes

| Método | Endpoint                        | Descrição                      | Auth |
|--------|---------------------------------|--------------------------------|------|
| GET    | /api/patients                   | Listar pacientes ativos        | ✅   |
| GET    | /api/patients/{id}              | Buscar por ID                  | ✅   |
| POST   | /api/patients                   | Criar paciente                 | ✅   |
| PUT    | /api/patients/{id}              | Atualizar paciente             | ✅   |
| PATCH  | /api/patients/{id}/deactivate   | Inativar (soft delete)         | ✅   |

**Enum PaymentCycle:**
```
1 = Por Sessão  |  2 = Quinzenal  |  3 = Mensal  |  4 = Semanal
```

---

### Responsáveis Legais

| Método | Endpoint            | Descrição                  | Auth |
|--------|---------------------|----------------------------|------|
| GET    | /api/guardians/{id} | Buscar responsável por ID  | ✅   |
| POST   | /api/guardians      | Criar responsável          | ✅   |

---

### Agendamentos

| Método | Endpoint                                    | Descrição                                          | Auth |
|--------|---------------------------------------------|----------------------------------------------------|------|
| GET    | /api/appointments                           | Listar todos os agendamentos do fisioterapeuta     | ✅   |
| GET    | /api/appointments/{id}                      | Buscar por ID                                      | ✅   |
| GET    | /api/appointments/range?start=&end=         | Agendamentos por período (usado pelo calendário)   | ✅   |
| GET    | /api/appointments/patient/{patientId}       | Agendamentos de um paciente                        | ✅   |
| GET    | /api/appointments/pending-payments          | Sessões concluídas com pagamento pendente (agrupadas por paciente) | ✅ |
| POST   | /api/appointments                           | Criar agendamento (verifica conflito de horário)   | ✅   |
| PUT    | /api/appointments/{id}                      | Atualizar status, pagamento, horário               | ✅   |
| PATCH  | /api/appointments/batch-pay                 | Marcar múltiplos agendamentos como pagos           | ✅   |

**Enum AppointmentStatus:**
```
1 = Agendada  |  2 = Concluída  |  3 = Falta  |  4 = Cancelada
```

**Enum PaymentStatus:**
```
1 = Pendente  |  2 = Pago  |  3 = Dispensado
```

**Enum PaymentMethod:**
```
1 = Pix  |  2 = Dinheiro  |  3 = Cartão
```

---

### Evoluções Clínicas

| Método | Endpoint                                     | Descrição                                | Auth |
|--------|----------------------------------------------|------------------------------------------|------|
| GET    | /api/evolutions/patient/{patientId}          | Histórico de evoluções do paciente       | ✅   |
| GET    | /api/evolutions/appointment/{appointmentId}  | Evolução de um agendamento específico    | ✅   |
| GET    | /api/evolutions/{id}                         | Buscar por ID                            | ✅   |
| POST   | /api/evolutions                              | Registrar evolução (sessão deve estar Concluída) | ✅ |
| PUT    | /api/evolutions/{id}                         | Atualizar evolução                       | ✅   |

---

### Avaliações e Anamneses

| Método | Endpoint                              | Descrição                       | Auth |
|--------|---------------------------------------|---------------------------------|------|
| GET    | /api/assessments/patient/{patientId}  | Avaliações do paciente          | ✅   |
| GET    | /api/assessments/{id}                 | Buscar por ID                   | ✅   |
| POST   | /api/assessments                      | Registrar avaliação / anamnese  | ✅   |
| PUT    | /api/assessments/{id}                 | Atualizar avaliação             | ✅   |

**Enum AssessmentType:**
```
1 = Avaliação Inicial  |  2 = Reavaliação Trimestral  |  3 = Alta Clínica
```

---

### Protocolos de Tratamento

| Método | Endpoint                                    | Descrição                                    | Auth |
|--------|---------------------------------------------|----------------------------------------------|------|
| GET    | /api/protocols/patient/{patientId}          | Todos os protocolos do paciente              | ✅   |
| GET    | /api/protocols/patient/{patientId}/active   | Apenas protocolos ativos                     | ✅   |
| GET    | /api/protocols/{id}                         | Buscar por ID                                | ✅   |
| POST   | /api/protocols                              | Criar protocolo                              | ✅   |
| PUT    | /api/protocols/{id}                         | Atualizar protocolo (incluindo isActive)     | ✅   |
| PATCH  | /api/protocols/{id}/complete-session        | Registrar sessão manualmente (sem agendamento vinculado) | ✅ |

---

### Dashboard

| Método | Endpoint                 | Descrição                                        | Auth |
|--------|--------------------------|--------------------------------------------------|------|
| GET    | /api/dashboard           | Resumo do dia: totais, receita, lista de sessões | ✅   |
| GET    | /api/dashboard/no-shows  | Pacientes que faltaram e não remarcaram          | ✅   |

---

### Anexos

| Método | Endpoint                              | Descrição                         | Auth |
|--------|---------------------------------------|-----------------------------------|------|
| GET    | /api/attachments/patient/{patientId}  | Listar anexos do paciente         | ✅   |
| GET    | /api/attachments/{id}/download        | Download do arquivo               | ✅   |
| POST   | /api/attachments                      | Upload (multipart/form-data)      | ✅   |
| DELETE | /api/attachments/{id}                 | Deletar anexo                     | ✅   |

---

## Exemplos com cURL

### 1. Registrar fisioterapeuta

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Dra. Priscila Silva",
    "email": "priscila@physioflow.com",
    "password": "senha123",
    "phone": "19999999999",
    "crefito": "CREFITO-3/12345-F"
  }'
```

### 2. Login e salvar token

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priscila@physioflow.com","password":"senha123"}' \
  | jq -r '.accessToken')
```

### 3. Criar paciente com ciclo mensal

```bash
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullName": "Maria Santos",
    "birthDate": "1990-05-15",
    "phone": "19988887777",
    "email": "maria@email.com",
    "cpf": "123.456.789-00",
    "paymentCycle": 3,
    "paymentDay": "dia 5",
    "defaultSessionValue": 150.00
  }'
```

### 4. Criar agendamento

```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "GUID_DO_PACIENTE",
    "startDateTime": "2026-04-20T14:00:00",
    "endDateTime": "2026-04-20T15:00:00",
    "sessionValue": 150.00,
    "notes": "Trazer exame de imagem"
  }'
```

### 5. Concluir sessão — paciente paga na hora (Pix)

```bash
curl -X PUT http://localhost:5000/api/appointments/GUID_DO_AGENDAMENTO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "status": 2, "paymentStatus": 2, "paymentMethod": 1 }'
```

### 6. Concluir sessão — paciente mensal (pagamento fica pendente)

```bash
curl -X PUT http://localhost:5000/api/appointments/GUID_DO_AGENDAMENTO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "status": 2, "paymentStatus": 1 }'
```

### 7. Ver pagamentos pendentes agrupados por paciente

```bash
curl http://localhost:5000/api/appointments/pending-payments \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Marcar múltiplas sessões como pagas

```bash
curl -X PATCH http://localhost:5000/api/appointments/batch-pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appointmentIds": ["GUID1", "GUID2", "GUID3"],
    "paymentMethod": 1
  }'
```

### 9. Registrar evolução clínica

```bash
curl -X POST http://localhost:5000/api/evolutions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appointmentId": "GUID_DO_AGENDAMENTO",
    "proceduresPerformed": "Alongamento e mobilização articular",
    "techniquesApplied": "RPG e liberação miofascial",
    "painScale": 4,
    "clinicalNotes": "Paciente relatou melhora significativa",
    "nextSessionPlan": "Aumentar carga dos exercícios"
  }'
```

### 10. Criar protocolo de tratamento

```bash
curl -X POST http://localhost:5000/api/protocols \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "GUID_DO_PACIENTE",
    "treatmentName": "Reabilitação Joelho Pós-Cirúrgico",
    "totalCycles": 3,
    "sessionsPerCycle": 10
  }'
```

### 11. Agendamentos da semana (usado pelo calendário)

```bash
curl "http://localhost:5000/api/appointments/range?start=2026-04-14T00:00:00Z&end=2026-04-20T23:59:59Z" \
  -H "Authorization: Bearer $TOKEN"
```

### 12. Dashboard do dia

```bash
curl http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## Comandos Úteis

```bash
# Iniciar banco de dados
docker-compose -f docker-compose.local.yaml up -d

# Parar banco
docker-compose -f docker-compose.local.yaml down

# Nova migration
dotnet ef migrations add NomeDaMigration \
  --project src/PhysioFlow.Infrastructure \
  --startup-project src/PhysioFlow.Api

# Aplicar migrations
dotnet ef database update \
  --project src/PhysioFlow.Infrastructure \
  --startup-project src/PhysioFlow.Api

# Build do backend
dotnet build

# Executar API
dotnet run --project src/PhysioFlow.Api

# Executar Frontend
cd PhysioFlow-web && npm run dev

# Acessar Swagger
# http://localhost:5000/swagger
# Clique em Authorize 🔒 e insira: Bearer <seu_token>
```

---

© 2026 — PhysioFlow · Desenvolvido por Juan Moraes como TCC
