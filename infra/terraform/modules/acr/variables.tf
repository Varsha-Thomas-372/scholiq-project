variable "name" {
  type = string
}

variable "resource_group" {
  type = string
}

variable "location" {
  type = string
}

variable "admin_enabled" {
  type    = bool
  default = true
}

variable "tags" {
  type = map(string)
}