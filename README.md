# SCHOLIQ - Full Stack + Review Infra Pack

SCHOLIQ is an AI-powered study intelligence platform with:
- Real frontend and backend implementation
- Supabase persistence
- FastAPI + Claude integration
- Live YouTube and Medium link fetching
- DevOps, Terraform, containerization, and security workflows for review requirements

## Project Structure

```text
.
├─ backend/
├─ frontend/
├─ infra/terraform/
├─ k8s/
├─ .github/workflows/
├─ docs/
├─ supabase_schema.sql
└─ docker-compose.yml
```

## 1) Local App Setup

### Database
Run [`supabase_schema.sql`](/C:/Users/Varsha%20Thomas/Documents/New%20project/supabase_schema.sql) in Supabase SQL editor.

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` with:
- `ANTHROPIC_API_KEY`
- `YOUTUBE_API_KEY`
- `SERPAPI_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`

Run:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env` with:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL=http://127.0.0.1:8000`

## 2) Docker Setup

```bash
docker compose up --build
```

Files:
- [`backend/Dockerfile`](/C:/Users/Varsha%20Thomas/Documents/New%20project/backend/Dockerfile)
- [`frontend/Dockerfile`](/C:/Users/Varsha%20Thomas/Documents/New%20project/frontend/Dockerfile)
- [`docker-compose.yml`](/C:/Users/Varsha%20Thomas/Documents/New%20project/docker-compose.yml)

## 3) Terraform (Review II requirement)

Path: [`infra/terraform`](/C:/Users/Varsha%20Thomas/Documents/New%20project/infra/terraform)

```bash
cd infra/terraform
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

Key modules:
- `modules/network`
- `modules/data`
- `modules/app_service`

Provisioned stack includes:
- Resource Group
- VNet + subnet
- App Insights + Log Analytics
- Blob Storage (GRS)
- Azure SQL Database (S2)
- App Service Plan (P1v2) + Linux Web App
- Front Door profile/endpoint/route

## 4) Kubernetes (Review II requirement)

Manifests in [`k8s/`](/C:/Users/Varsha%20Thomas/Documents/New%20project/k8s):
- namespace
- backend deployment/service
- frontend deployment/service
- backend secret template

Apply:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend-secret.example.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

## 5) CI/CD and Security Automation

Workflows:
- CI/CD build + Docker push: [`.github/workflows/ci-cd.yml`](/C:/Users/Varsha%20Thomas/Documents/New%20project/.github/workflows/ci-cd.yml)
- Terraform plan/apply: [`.github/workflows/terraform.yml`](/C:/Users/Varsha%20Thomas/Documents/New%20project/.github/workflows/terraform.yml)
- SAST (CodeQL): [`.github/workflows/codeql.yml`](/C:/Users/Varsha%20Thomas/Documents/New%20project/.github/workflows/codeql.yml)
- DAST (OWASP ZAP baseline): [`.github/workflows/zap-baseline.yml`](/C:/Users/Varsha%20Thomas/Documents/New%20project/.github/workflows/zap-baseline.yml)

## 6) Review Deliverables (Docs)

- Review I strategy: [`docs/Review1_Azure_Deployment_Strategy.md`](/C:/Users/Varsha%20Thomas/Documents/New%20project/docs/Review1_Azure_Deployment_Strategy.md)
- Review II pack: [`docs/TeamXX_ReviewII.md`](/C:/Users/Varsha%20Thomas/Documents/New%20project/docs/TeamXX_ReviewII.md)
- GenAI cloud mapping: [`docs/GenAI_UseCases_Cloud_Mapping.md`](/C:/Users/Varsha%20Thomas/Documents/New%20project/docs/GenAI_UseCases_Cloud_Mapping.md)
- Security report: [`docs/Security_Report.md`](/C:/Users/Varsha%20Thomas/Documents/New%20project/docs/Security_Report.md)
- Fix note: [`docs/How_We_Fixed_Issues.md`](/C:/Users/Varsha%20Thomas/Documents/New%20project/docs/How_We_Fixed_Issues.md)
- Monitoring evidence: [`docs/Monitoring_Dashboard.md`](/C:/Users/Varsha%20Thomas/Documents/New%20project/docs/Monitoring_Dashboard.md)

## 7) Required GitHub Secrets for Pipelines

- `AZURE_CREDENTIALS`
- `ACR_NAME`
- `TF_VAR_SQL_ADMIN_LOGIN`
- `TF_VAR_SQL_ADMIN_PASSWORD`

## Notes

- Frontend-only run is not sufficient for full product features.
- API keys and secrets must stay out of source control.
- Rotate any secrets previously shared in chats/logs.
