output "resource_group_name" {
  value = module.network.resource_group_name
}

output "app_service_name" {
  value = module.app_service.app_service_name
}

output "frontdoor_endpoint" {
  value = azurerm_cdn_frontdoor_endpoint.main.host_name
}

output "sql_server_fqdn" {
  value = module.data.sql_server_fqdn
}

output "storage_account_name" {
  value = module.data.storage_account_name
}
