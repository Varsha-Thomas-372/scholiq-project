resource "azurerm_cdn_profile" "this" {
  name                = var.name
  resource_group_name = var.resource_group
  location            = var.location_primary
  sku                 = "Standard_Microsoft"
  tags                = var.tags
}

resource "azurerm_cdn_endpoint" "this" {
  name                = "${var.name}-endpoint"
  profile_name        = azurerm_cdn_profile.this.name
  location            = var.location_primary
  resource_group_name = var.resource_group

  origin {
    name      = "app-service"
    host_name = var.app_service_hostname
  }

  https_redirect_enabled = true


  tags = var.tags
}

