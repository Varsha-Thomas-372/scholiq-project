variable "prefix" {
  type        = string
  description = "Project prefix"
  default     = "scholiq"
}

variable "environment" {
  type        = string
  description = "Environment name"
  default     = "prod"
}

variable "location_primary" {
  type        = string
  description = "Primary Azure region"
  default     = "Central India"
}

variable "location_dr" {
  type        = string
  description = "Disaster recovery region"
  default     = "South India"
}

variable "sql_admin_login" {
  type        = string
  description = "Azure SQL administrator login"
  sensitive   = true
}

variable "sql_admin_password" {
  type        = string
  description = "Azure SQL administrator password"
  sensitive   = true
}

variable "allowed_ips" {
  type        = list(string)
  description = "Public IPs allowed to access SQL"
  default     = []
}

variable "backend_env" {
  type        = map(string)
  description = "Backend environment variables for App Service"
  default     = {}
  sensitive   = true
}
