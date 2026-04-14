# PhysioFlow API

Sistema de gestão de atendimentos de fisioterapia — **ASP.NET Core 8** + **PostgreSQL** + **Next.js 14**

---

## Índice

1. [Requisitos](#requisitos)
2. [Instalação e Início](#instalação-e-início)
3. [Autenticação](#autenticação)
4. [Endpoints da API](#endpoints-da-api)
5. [Exemplos com cURL](#exemplos-com-curl)
6. [Swagger](#swagger)

---

## Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [Node.js 18+](https://nodejs.org/) para o frontend

---

## Instalação e Início

### 1. Clone o projeto
```bash
git clone <seu-repo>
cd PhysioFlow
2. Inicie o banco de dados

docker-compose -f docker-compose.local.yaml up -d
3. Aplique as migrations

dotnet ef database update --project src/PhysioFlow.Infrastructure --startup-project src/PhysioFlow.Api
4. Execute a API

dotnet run --project src/PhysioFlow.Api
5. Execute o Frontend

cd PhysioFlow-web
npm install
npm run dev
Acesse
Frontend: http://localhost:3000
API: http://localhost:5000
Swagger: http://localhost:5000/swagger
Autenticação
A API usa JWT. Todas as rotas (exceto login/register) exigem o token no header:


Authorization: Bearer SEU_TOKEN
Endpoints da API
Auth
Método	Endpoint	Descrição	Auth
POST	/api/auth/register	Criar conta de fisioterapeuta	❌
POST	/api/auth/login	Login — retorna JWT	❌
Usuários
Método	Endpoint	Descrição	Auth
GET	/api/users/me	Dados do usuário logado	✅
PUT	/api/users/me	Atualizar perfil (nome, telefone, cpf, crefito)	✅
Pacientes
Método	Endpoint	Descrição	Auth
GET	/api/patients	Listar pacientes ativos do fisio	✅
GET	/api/patients/{id}	Buscar por ID	✅
POST	/api/patients	Criar paciente	✅
PUT	/api/patients/{id}	Atualizar paciente	✅
PATCH	/api/patients/{id}/deactivate	Inativar paciente (soft delete)	✅
PaymentCycle: 1 = Por Sessão · 2 = Quinzenal · 3 = Mensal

Responsáveis (Guardians)
Método	Endpoint	Descrição	Auth
GET	/api/guardians/{id}	Buscar responsável por ID	✅
POST	/api/guardians	Criar responsável	✅
Agendamentos
Método	Endpoint	Descrição	Auth
GET	/api/appointments/range?start=&end=	Agendamentos por período	✅
GET	/api/appointments/patient/{patientId}	Agendamentos de um paciente	✅
GET	/api/appointments/pending-payments	Sessões concluídas com pgto pendente	✅
GET	/api/appointments/{id}	Buscar por ID	✅
POST	/api/appointments	Criar agendamento	✅
PUT	/api/appointments/{id}	Atualizar status, pagamento, etc.	✅
PATCH	/api/appointments/batch-pay	Marcar múltiplos agendamentos como pagos	✅
AppointmentStatus: 1 = Scheduled · 2 = Completed · 3 = NoShow · 4 = Cancelled

PaymentStatus: 1 = Pending · 2 = Paid · 3 = Waived

PaymentMethod: 1 = Pix · 2 = Cash · 3 = Card

Evoluções
Método	Endpoint	Descrição	Auth
GET	/api/evolutions/patient/{patientId}	Evoluções de um paciente	✅
GET	/api/evolutions/appointment/{appointmentId}	Evolução de um agendamento	✅
GET	/api/evolutions/{id}	Buscar por ID	✅
POST	/api/evolutions	Registrar evolução (sessão deve estar Completed)	✅
PUT	/api/evolutions/{id}	Atualizar evolução	✅
Avaliações (Anamneses)
Método	Endpoint	Descrição	Auth
GET	/api/assessments/patient/{patientId}	Avaliações de um paciente	✅
GET	/api/assessments/{id}	Buscar por ID	✅
POST	/api/assessments	Registrar avaliação/anamnese	✅
PUT	/api/assessments/{id}	Atualizar avaliação	✅
AssessmentType: 1 = Initial · 2 = Quarterly

Protocolos de Tratamento
Método	Endpoint	Descrição	Auth
GET	/api/protocols/patient/{patientId}	Todos os protocolos do paciente	✅
GET	/api/protocols/patient/{patientId}/active	Apenas protocolos ativos	✅
GET	/api/protocols/{id}	Buscar por ID	✅
POST	/api/protocols	Criar protocolo	✅
PUT	/api/protocols/{id}	Atualizar protocolo	✅
PATCH	/api/protocols/{id}/complete-session	Registrar sessão concluída manualmente	✅
Dashboard
Método	Endpoint	Descrição	Auth
GET	/api/dashboard/today	Agendamentos do dia atual	✅
GET	/api/dashboard/no-shows	Pacientes que faltaram sem reagendar	✅
Anexos
Método	Endpoint	Descrição	Auth
GET	/api/attachments/patient/{patientId}	Listar anexos do paciente	✅
GET	/api/attachments/{id}/download	Download do arquivo	✅
POST	/api/attachments	Upload (multipart/form-data)	✅
DELETE	/api/attachments/{id}	Deletar anexo	✅
Exemplos com cURL
1. Registrar fisioterapeuta

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Dra. Priscila Silva",
    "email": "priscila@physioflow.com",
    "password": "senha123",
    "phone": "19999999999",
    "crefito": "CREFITO-3/12345-F"
  }'
2. Login e salvar token

TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priscila@physioflow.com","password":"senha123"}' \
  | jq -r '.accessToken')
echo "Token: $TOKEN"
3. Criar paciente com ciclo mensal

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
4. Criar agendamento

curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "ID_DO_PACIENTE",
    "startDateTime": "2026-04-05T14:00:00",
    "endDateTime": "2026-04-05T15:00:00",
    "sessionValue": 150.00,
    "notes": "Trazer exame de imagem"
  }'
5. Concluir sessão — pagamento na hora

curl -X PUT http://localhost:5000/api/appointments/ID_DO_AGENDAMENTO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": 2,
    "paymentStatus": 2,
    "paymentMethod": 1
  }'
6. Concluir sessão — pagar depois (paciente mensal)

curl -X PUT http://localhost:5000/api/appointments/ID_DO_AGENDAMENTO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": 2,
    "paymentStatus": 1
  }'
7. Ver pagamentos pendentes agrupados

curl http://localhost:5000/api/appointments/pending-payments \
  -H "Authorization: Bearer $TOKEN"
8. Marcar múltiplas sessões como pagas (paciente mensal)

curl -X PATCH http://localhost:5000/api/appointments/batch-pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appointmentIds": ["ID1", "ID2", "ID3", "ID4"],
    "paymentMethod": 1
  }'
9. Registrar anamnese

curl -X POST http://localhost:5000/api/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "ID_DO_PACIENTE",
    "type": 1,
    "assessmentDate": "2026-04-01T12:00:00Z",
    "anamnesisAnswers": "{\"queixaPrincipal\":\"Dor no joelho direito\",\"localDaDor\":\"Joelho direito\",\"atividadeFisica\":\"sedentario\",\"qualidadeDeSono\":\"regular\"}",
    "generalNotes": "Paciente chegou com dificuldade de locomoção"
  }'
10. Registrar evolução (sessão deve estar Completed)

curl -X POST http://localhost:5000/api/evolutions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appointmentId": "ID_DO_AGENDAMENTO",
    "proceduresPerformed": "Alongamento e mobilização articular",
    "techniquesApplied": "RPG e liberação miofascial",
    "painScale": 4,
    "clinicalNotes": "Paciente relatou melhora significativa",
    "nextSessionPlan": "Aumentar carga dos exercícios"
  }'
11. Criar protocolo de tratamento

curl -X POST http://localhost:5000/api/protocols \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "ID_DO_PACIENTE",
    "treatmentName": "Reabilitação Joelho Pós-Cirúrgico",
    "totalCycles": 3,
    "sessionsPerCycle": 10
  }'
12. Agendamentos da semana atual

curl "http://localhost:5000/api/appointments/range?start=2026-04-01T00:00:00Z&end=2026-04-07T23:59:59Z" \
  -H "Authorization: Bearer $TOKEN"
13. Dashboard do dia

curl http://localhost:5000/api/dashboard/today \
  -H "Authorization: Bearer $TOKEN"
14. Pacientes que faltaram sem reagendar

curl http://localhost:5000/api/dashboard/no-shows \
  -H "Authorization: Bearer $TOKEN"
Swagger
Acesse http://localhost:5000/swagger

Clique em Authorize 🔒
Digite: Bearer SEU_TOKEN
Teste qualquer endpoint
Comandos Úteis

# Iniciar banco
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

# Build
dotnet build

# Executar API
dotnet run --project src/PhysioFlow.Api

# Executar Frontend
cd PhysioFlow-web && npm run dev
Proprietário © 2026 — PhysioFlow

-------------------


priscila@physioflow.com