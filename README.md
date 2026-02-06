# 🧠 PsicoFlow API

Sistema de gestão de atendimentos psicológicos — **ASP.NET Core 8** + **PostgreSQL**

---

## � Índice

1. [Requisitos](#-requisitos)
2. [Instalação e Início](#-instalação-e-início)
3. [Autenticação](#-autenticação)
4. [Endpoints da API](#-endpoints-da-api)
   - [Auth](#auth)
   - [Usuários](#usuários)
   - [Pacientes](#pacientes)
   - [Consultas](#consultas)
   - [Prontuários](#prontuários)
5. [Exemplos com cURL](#-exemplos-completos-com-curl)
6. [Swagger](#-swagger)
7. [Ambientes](#-ambientes)

---

## 🔧 Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- Editor: VS Code ou Rider

---

## 🚀 Instalação e Início

### 1. Clone o projeto
```bash
git clone <seu-repo>
cd PsicoFlow
```

### 2. Inicie o banco de dados
```bash
docker-compose -f docker-compose.local.yaml up -d
```
Isso inicia o PostgreSQL na porta `5432`.

### 3. Execute a API
```bash
dotnet run --project src/PsicoFlow.Api
```

### 4. Acesse
- **API**: http://localhost:5000
- **Swagger**: http://localhost:5000/swagger
- **Health Check**: http://localhost:5000/health

### ✅ Verificar se está funcionando
```bash
curl http://localhost:5000/health
# Resposta: {"status":"healthy","timestamp":"..."}
```

---

## 🔐 Autenticação

A API usa **JWT (JSON Web Token)**. Todas as rotas (exceto login/register) exigem o token.

### Fluxo de Autenticação

```
1. POST /api/auth/register  → Criar conta
2. POST /api/auth/login     → Receber token JWT
3. Usar token em todas as requisições → Header: Authorization: Bearer <token>
```

### Obter o Token

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "psicologo@exemplo.com",
    "password": "senha123"
  }'
```

**Resposta:**
```json
{
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Dr. João Silva",
    "email": "psicologo@exemplo.com",
    "role": 1
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Usar o Token
Adicione em todas as requisições:
```bash
-H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📡 Endpoints da API

### Auth

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Criar nova conta | ❌ |
| POST | `/api/auth/login` | Login (retorna JWT) | ❌ |
| POST | `/api/auth/forgot-password` | Solicitar reset de senha | ❌ |
| POST | `/api/auth/reset-password` | Resetar senha com token | ❌ |

---

### Usuários

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/users/me` | Dados do usuário logado | ✅ |
| GET | `/api/users` | Listar todos (Admin) | ✅ Admin |
| GET | `/api/users/{id}` | Buscar por ID | ✅ |
| PUT | `/api/users/{id}` | Atualizar usuário | ✅ |
| DELETE | `/api/users/{id}` | Deletar (Admin) | ✅ Admin |

**Roles disponíveis:**
- `0` = Admin
- `1` = Psicologo
- `2` = Secretario
- `3` = Paciente
- `4` = Responsavel

---

### Pacientes

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/patients` | Listar pacientes do psicólogo | ✅ |
| GET | `/api/patients?search=nome` | Buscar por nome | ✅ |
| GET | `/api/patients/{id}` | Buscar por ID | ✅ |
| POST | `/api/patients` | Criar paciente | ✅ |
| PUT | `/api/patients/{id}` | Atualizar | ✅ |
| DELETE | `/api/patients/{id}` | Deletar | ✅ |

---

### Consultas

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/consultations` | Listar consultas | ✅ |
| GET | `/api/consultations?startDate=...&endDate=...` | Filtrar por período | ✅ |
| GET | `/api/consultations?status=0` | Filtrar por status | ✅ |
| GET | `/api/consultations/{id}` | Buscar por ID | ✅ |
| POST | `/api/consultations` | Agendar consulta | ✅ |
| PUT | `/api/consultations/{id}` | Atualizar | ✅ |
| PATCH | `/api/consultations/{id}/status` | Mudar status | ✅ |
| DELETE | `/api/consultations/{id}` | Cancelar | ✅ |

**Status de Consulta:**
- `0` = Agendada
- `1` = Realizada
- `2` = Cancelada
- `3` = Faltou

**Tipo de Consulta:**
- `0` = Online
- `1` = Presencial

---

### Prontuários

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/clinical-records/patient/{patientId}` | Por paciente | ✅ |
| GET | `/api/clinical-records/consultation/{consultationId}` | Por consulta | ✅ |
| GET | `/api/clinical-records/{id}` | Buscar por ID | ✅ |
| POST | `/api/clinical-records` | Criar prontuário | ✅ |
| PUT | `/api/clinical-records/{id}` | Atualizar | ✅ |
| DELETE | `/api/clinical-records/{id}` | Deletar | ✅ |

---

## � Exemplos Completos com cURL

### 1. Registrar Usuário (Psicólogo)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. João Silva",
    "email": "joao@exemplo.com",
    "password": "senha123",
    "phone": "11999999999",
    "role": 1,
    "address": {
      "street": "Rua das Flores",
      "number": 123,
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567"
    }
  }'
```

---

### 2. Login

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@exemplo.com","password":"senha123"}' \
  | jq -r '.accessToken')

echo "Token: $TOKEN"
```

---

### 3. Criar Paciente

```bash
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Maria Santos",
    "email": "maria@exemplo.com",
    "phone": "11988888888",
    "birthDate": "1990-05-15"
  }'
```

---

### 4. Listar Pacientes

```bash
curl http://localhost:5000/api/patients \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5. Buscar Paciente por Nome

```bash
curl "http://localhost:5000/api/patients?search=Maria" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 6. Atualizar Paciente

```bash
curl -X PUT http://localhost:5000/api/patients/{PATIENT_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phone": "11977777777",
    "email": "maria.novo@exemplo.com"
  }'
```

---

### 7. Deletar Paciente

```bash
curl -X DELETE http://localhost:5000/api/patients/{PATIENT_ID} \
  -H "Authorization: Bearer $TOKEN"
```

---

### 8. Agendar Consulta

```bash
curl -X POST http://localhost:5000/api/consultations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "ID_DO_PACIENTE",
    "startAt": "2026-02-10T14:00:00",
    "endAt": "2026-02-10T15:00:00",
    "type": 1,
    "location": "Sala 3",
    "observation": "Primeira sessão"
  }'
```

---

### 9. Listar Consultas por Período

```bash
curl "http://localhost:5000/api/consultations?startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 10. Marcar Consulta como Realizada

```bash
curl -X PATCH http://localhost:5000/api/consultations/{CONSULT_ID}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": 1}'
```

---

### 11. Criar Prontuário

```bash
curl -X POST http://localhost:5000/api/clinical-records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "consultationId": "ID_DA_CONSULTA",
    "summary": "Paciente relatou melhora nos sintomas de ansiedade.",
    "therapeuticGoals": "Continuar técnicas de respiração. Introduzir mindfulness.",
    "observations": "Próxima sessão: focar em situações gatilho."
  }'
```

---

### 12. Listar Prontuários do Paciente

```bash
curl http://localhost:5000/api/clinical-records/patient/{PATIENT_ID} \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📖 Swagger

Acesse **http://localhost:5000/swagger** para documentação interativa.

1. Clique em **"Authorize"** 🔒
2. Digite: `Bearer SEU_TOKEN`
3. Teste qualquer endpoint direto pelo navegador

---

## 🌍 Ambientes

| Ambiente | Comando | Descrição |
|----------|---------|-----------|
| **Local** | `docker-compose -f docker-compose.local.yaml up -d` + `dotnet run` | Desenvolvimento |
| **Dev/Staging** | `docker-compose -f docker-compose.dev.yaml up --build` | Testar em container |
| **Produção** | `docker-compose -f docker-compose.prod.yaml up -d` | Deploy final |

---

## 🛠️ Comandos Úteis

```bash
# Ver logs do banco
docker logs psicoflow-db-local

# Parar o banco
docker-compose -f docker-compose.local.yaml down

# Rebuild completo
dotnet clean && dotnet build

# Criar nova migration
dotnet ef migrations add NomeDaMigration \
  --project src/PsicoFlow.Infrastructure \
  --startup-project src/PsicoFlow.Api

# Aplicar migrations manualmente
dotnet ef database update \
  --project src/PsicoFlow.Infrastructure \
  --startup-project src/PsicoFlow.Api
```

---

## 📄 Licença

Proprietário © 2026
