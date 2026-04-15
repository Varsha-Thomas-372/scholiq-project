resource "azurerm_storage_account" "main" {
  name                     = lower(replace("${var.name}blob", "-", ""))
  resource_group_name      = var.resource_group
  location                 = var.location_primary
  account_tier             = "Standard"
  account_replication_type = "GRS"
  min_tls_version          = "TLS1_2"
  tags                     = var.tags
}

resource "azurerm_storage_container" "media" {
  name                  = "syllabi-media"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_mssql_server" "main" {
  name                         = "${var.name}-sqlsrv"
  resource_group_name          = var.resource_group
  location                     = var.location_primary
  version                      = "12.0"
  administrator_login          = var.sql_admin_login
  administrator_login_password = var.sql_admin_password
  minimum_tls_version          = "1.2"
  tags                         = var.tags
}

resource "azurerm_mssql_database" "main" {
  name           = "${var.name}-sqldb"
  server_id      = azurerm_mssql_server.main.id
  sku_name       = "S2"
  max_size_gb    = 250
  zone_redundant = false
  tags           = var.tags
}

resource "azurerm_mssql_firewall_rule" "allowed" {
  for_each         = { for idx, ip in var.allowed_ips : idx => ip }
  name             = "allow-${each.key}"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = each.value
  end_ip_address   = each.value
}
