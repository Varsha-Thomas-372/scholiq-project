# Azure Full Connection & Architecture Implementation TODO

## Approved Plan Summary
Migrate to full Azure stack: App Service/SQL/Blob/AD B2C/Front Door/Functions/AKS/ACR + CI/CD/Monitoring/GenAI/Security. Iterative via Terraform → Code → Deploy.

## Step-by-Step Plan (Execute Sequentially)

### Phase 1: Infrastructure (Terraform)
- [x] 1.1 Update regions to Central India (primary)/South India (DR) in terraform.tfvars + geo-rep.
- [x] 1.2 Clean tfvars: Remove Supabase keys, add placeholders for new secrets.
- [x] 1.3 Add Terraform modules: ad_b2c, front_door, functions, aks/acr, keyvault. (KeyVault/ACR/FrontDoor + main.tf integration, app_service MSI)
- [x] 1.4 Replicate supabase_schema.sql → azure_schema.sql + DB init in app_service.
- [ ] 1.5 `cd infra/terraform && terraform init && terraform validate && terraform plan -var-file="terraform.tfvars"` (run manually due to cmd shell)
- [ ] 1.6 User approve → `terraform apply`
- [ ] 1.7 Document outputs (endpoints, creds) in docs/TERRAFORM_OUTPUTS.md

### Phase 2: Backend Migration
- [x] 2.1 requirements.txt: + azure deps (storage-blob, identity, pyodbc, sqlalchemy, msal)
- [x] 2.2 config.py: Azure connstr vars, remove Supabase.
- [x] 2.3 services/: supabase_service.py → azure_db_service.py/azure_blob_service.py (CRUD + upload), routers imports updated
- [x] 2.4 auth.py: AD B2C JWT validate (main.py middleware msal).
- [x] 2.5 main.py/Dockerfile: SQL init ready, health/test endpoints (/health /test-db /upload-test).
- [ ] 2.6 Test local: docker-compose up, migrate data.

### Phase 3: Frontend & Auth
- [ ] 3.1 api/supabase.ts → delete; api/azure_auth.ts (MSAL), backend.ts (token headers, Blob signed URLs).
- [ ] 3.2 App.tsx: MSAL provider, ProtectedRoute → AD B2C.
- [ ] 3.3 Test: Login/upload/MCQ.

### Phase 4: CI/CD & Advanced
- [ ] 4.1 GitHub secrets: AZURE_CREDENTIALS, B2C_APP_ID, ACR etc. (user setup).
- [ ] 4.2 workflows/: Enable ACR/AKS deploy, + Sonar/OWASP in security.yml.
- [ ] 4.3 k8s/: Ingress TLS for Front Door.
- [ ] 4.4 Functions: Triggers for reports/GenAI batch.
- [ ] 4.5 Trigger CI/CD → Deploy.

### Phase 5: Security/Monitoring/Demo
- [ ] 5.1 RBAC policies, backups/DR enable.
- [ ] 5.2 App Insights alerts/dashboard screenshots → docs/.
- [ ] 5.3 Security scans report.
- [ ] 5.4 Power BI embed demo.
- [ ] 5.5 Architecture diagram mermaid in README.md.
- [ ] 5.6 `attempt_completion`: Full demo cmds (az portal, kubectl get).

**Progress: Starting Phase 1**

* Next: Add modules (1.3), then init/plan (1.5).
* Blockers: Azure CLI login if needed (`az login`), API keys for tfvars.

