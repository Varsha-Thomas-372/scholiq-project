variable "name" {
  type = string
}

variable "location_primary" {
  type = string
}

variable "resource_group" {
  type = string
  # Review 1: Use for private endpoints (azurerm_private_endpoint to SQL/Storage subnets in network module)
}

variable "sql_admin_login" {
  type      = string
  sensitive = true
}

variable "sql_admin_password" {
  type      = string
  sensitive = true
}

variable "allowed_ips" {
  type = list(string)
}

variable "tags" {
  type = map(string)
}
