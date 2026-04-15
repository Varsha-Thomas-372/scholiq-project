# TeamXX_ReviewII Deliverable Pack

## 1) DevOps Automation and Infrastructure
- Terraform IaC: [`infra/terraform`](/C:/Users/Varsha%20Thomas/Documents/New%20project/infra/terraform)
- CI/CD workflow: [`.github/workflows/ci-cd.yml`](/C:/Users/Varsha%20Thomas/Documents/New%20project/.github/workflows/ci-cd.yml)
- Terraform workflow: [`.github/workflows/terraform.yml`](/C:/Users/Varsha%20Thomas/Documents/New%20project/.github/workflows/terraform.yml)
- Pipeline flow:
  1. Build backend
  2. Build frontend
  3. Docker image build
  4. Optional ACR push (if secrets available)
  5. Optional AKS deploy step extension

## 2) Containerization and Orchestration
- Backend Dockerfile: [`backend/Dockerfile`](/C:/Users/Varsha%20Thomas/Documents/New%20project/backend/Dockerfile)
- Frontend Dockerfile: [`frontend/Dockerfile`](/C:/Users/Varsha%20Thomas/Documents/New%20project/frontend/Dockerfile)
- Local compose: [`docker-compose.yml`](/C:/Users/Varsha%20Thomas/Documents/New%20project/docker-compose.yml)
- Kubernetes manifests: [`k8s/`](/C:/Users/Varsha%20Thomas/Documents/New%20project/k8s)

## 3) GenAI Integration and Cloud Mapping
- GenAI-enabled endpoints in backend:
  - `/parse-syllabus` (Claude parsing)
  - `/generate-mcq` (Claude MCQ generation)
  - `/replan-schedule` (Claude schedule replanning)
- Service integration flow:
  - Frontend -> FastAPI -> Claude / YouTube / SerpAPI -> Supabase

## 4) Demo Runbook (10 mins)
1. Show CI/CD run from GitHub Actions (3 min)
2. Run Docker stack locally (`docker compose up`) (3 min)
3. Upload syllabus and show AI flow + resources (2 min)
4. Q&A on architecture and trade-offs (2 min)
