variable "name" {
  type = string
}

variable "location_primary" {
  type = string
}

variable "resource_group" {
  type = string
  default = ""
}

variable "create_rg" {
  type    = bool
  default = false
}

variable "app_service_principal_ids" {
  type        = list(string)
  default     = []
  description = "Object IDs for App Service MSI or service principal"
}

variable "create_api_secrets" {
  type    = bool
  default = true
}

variable "anthropic_api_key" {
  type      = string
  default   = ""
  sensitive = true
}

variable "tags" {
  type = map(string)
}

