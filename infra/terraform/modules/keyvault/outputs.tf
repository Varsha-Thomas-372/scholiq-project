output "key_vault_name" {
  value = azurerm_key_vault.this.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.this.vault_uri
}

output "resource_group_name" {
  value = var.create_rg ? azurerm_resource_group.this[0].name : var.resource_group
}

