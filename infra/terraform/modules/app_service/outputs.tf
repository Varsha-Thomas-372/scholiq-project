output "app_service_name" {
  value = azurerm_linux_web_app.backend.name
}

output "default_hostname" {
  value = azurerm_linux_web_app.backend.default_hostname
}

output "identity_principal_id" {
  value = azurerm_linux_web_app.backend.identity[0].principal_id
}

output "identity_tenant_id" {
  value = azurerm_linux_web_app.backend.identity[0].tenant_id
}

