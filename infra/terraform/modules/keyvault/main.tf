resource "azurerm_resource_group" "this" {
  count    = var.create_rg ? 1 : 0
  name     = var.create_rg ? "${var.name}-kv-rg" : ""
  location = var.location_primary
  tags     = var.tags
}

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "this" {
  name                       = var.name
  location                   = var.location_primary
  resource_group_name        = var.create_rg ? azurerm_resource_group.this[0].name : var.resource_group
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  tags                       = var.tags

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    key_permissions = [
      "Get", "List", "Update", "Create", "Import", "Delete"
    ]

    secret_permissions = [
      "Get", "List", "Set", "Delete"
    ]

    storage_permissions = [
      "Get", "List"
    ]
  }

  # App Service access
  dynamic "access_policy" {
    for_each = var.app_service_principal_ids
    content {
      tenant_id = data.azurerm_client_config.current.tenant_id
      object_id = access_policy.value

      secret_permissions = [
        "Get", "List"
      ]
    }
  }
}

resource "azurerm_key_vault_secret" "anthropic" {
  count        = var.create_api_secrets ? 1 : 0
  name         = "anthropic-api-key"
  value        = var.anthropic_api_key
  key_vault_id = azurerm_key_vault.this.id
  tags         = var.tags
}

# Similar for other secrets...

