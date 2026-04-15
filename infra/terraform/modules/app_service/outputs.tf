output "app_service_name" {
  value = azurerm_linux_web_app.backend.name
}

output "default_hostname" {
  value = azurerm_linux_web_app.backend.default_hostname
}
