# Azure Deployment Checklist

## 1. Terraform (Infra)
- [ ] Fill terraform.tfvars API keys
- [ ] cd infra/terraform
- [ ] terraform init
- [ ] terraform plan (20+ resources)
- [ ] terraform apply
- [ ] Verify in Azure Portal: App Service, SQL, Blob, ACR, KeyVault, Front Door up

## 2. Backend Local Test
- [ ] docker build -t backend .
- [ ] docker run -p 8000:8000 -e AZURE_SQL_CONNSTR=... backend
- [ ] curl localhost:8000/health (sql/blob ok)
- [ ] curl -X POST localhost:8000/auth/signup -d '{"user_id":"test","email":"test@test.com","role":"STUDENT"}'
- [ ] curl localhost:8000/test-db ...
- [ ] curl localhost:8000/faculty/cohort

## 3. CI/CD
- [ ] GitHub Secrets: AZURE_CREDENTIALS, ACR_USERNAME, ACR_PASSWORD, AZURE_WEBAPP_PUBLISH_PROFILE
- [ ] git push main
- [ ] Actions tab → CI/CD green, ACR images pushed
- [ ] App Service shows new image

## 4. Live App
- [ ] App Service URL /health ok
- [ ] Frontend connects (VITE_API_BASE_URL = app url)
- [ ] Upload syllabus → Blob + SQL
- [ ] Faculty cohort shows data

## 5. Monitoring
- [ ] App Insights dashboard traffic/errors
- [ ] Front Door metrics

## Demo Script
1. Portal overview
2. App /health
3. Signup → cohort
4. Upload PDF → parse
5. CI/CD replay

