variable "name" {
  type = string
}

variable "location_primary" {
  type = string
}

variable "resource_group" {
  type = string
}

variable "app_insights_key" {
  type      = string
  sensitive = true
}

variable "backend_env" {
  type      = map(string)
  sensitive = true
}

variable "sql_connection" {
  type      = string
  sensitive = true
}

variable "storage_account" {
  type = string
}

variable "tags" {
  type = map(string)
}
