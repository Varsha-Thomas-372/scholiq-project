variable "prefix" {
  type    = string
  default = "scholiq"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "location_primary" {
  default = "koreacentral"
}

variable "location_dr" {
  default = "koreasouth"
}

variable "resource_group_name" {
  type    = string
  default = "scholiq-prod-rg"
}

variable "sql_admin_login" {
  type = string
}

variable "sql_admin_password" {
  type      = string
  sensitive = true
}

variable "allowed_ips" {
  type    = list(string)
  default = []
}

variable "backend_env" {
  type    = map(string)
  default = {}
}