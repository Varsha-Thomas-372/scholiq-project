output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "app_insights_connection_string" {
  value = azurerm_application_insights.main.connection_string
}
