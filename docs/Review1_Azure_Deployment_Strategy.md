# SCHOLIQ Review I: Azure Deployment Strategy

## Architecture Choice
- Cloud model: Public Azure
- Service model: PaaS-first (`App Service`, `Azure SQL`, `Blob Storage`)
- Region strategy: `Central India` (primary), `South India` (DR)

## Resource Mapping
- Web/API hosting: `Azure App Service` (`P1v2`)
- Database: `Azure SQL Database` (`S2`, 250 GB)
- File storage: `Azure Blob Storage` (Hot tier, GRS)
- Monitoring: `Azure Monitor` + `Application Insights`
- Edge routing: `Azure Front Door Standard`

## Reliability and DR
- App tier redundancy through App Service Plan scaling (2+ instances)
- SQL automated backups + PITR
- Blob storage GRS for cross-region redundancy
- Front Door for resilient routing

## Security
- Identity: Supabase Auth in app, Azure AD B2C planned for enterprise rollout
- Transport security: TLS 1.2+
- Data-at-rest encryption: platform-managed encryption in SQL and Blob
- Secret handling: GitHub secrets + Azure Key Vault (recommended for production)

## Cost and Scalability Controls
- App Service autoscale target 1-3 instances based on CPU and request load
- Blob lifecycle policy to move older objects to Cool tier
- CI/CD with staged rollout to reduce failed production deployments

## Infrastructure as Code
- Terraform code under [`infra/terraform`](/C:/Users/Varsha%20Thomas/Documents/New%20project/infra/terraform)
- Reusable modules:
  - `modules/network`
  - `modules/data`
  - `modules/app_service`
