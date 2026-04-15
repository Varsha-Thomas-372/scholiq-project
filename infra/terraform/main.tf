locals {
  name = "${var.prefix}-${var.environment}"
  tags = {
    project     = "SCHOLIQ"
    environment = var.environment
    managed_by  = "terraform"
  }
}

module "network" {
  source           = "./modules/network"
  name             = local.name
  location_primary = var.location_primary
  tags             = local.tags
}

module "data" {
  source             = "./modules/data"
  name               = local.name
  location_primary   = var.location_primary
  resource_group     = module.network.resource_group_name
  sql_admin_login    = var.sql_admin_login
  sql_admin_password = var.sql_admin_password
  allowed_ips        = var.allowed_ips
  tags               = local.tags
}

module "app_service" {
  source             = "./modules/app_service"
  name               = local.name
  location_primary   = var.location_primary
  resource_group     = module.network.resource_group_name
  app_insights_key   = module.network.app_insights_connection_string
  backend_env        = var.backend_env
  sql_connection     = module.data.sql_connection_string
  storage_account    = module.data.storage_account_name
  tags               = local.tags
}

resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = "${local.name}-fd-profile"
  resource_group_name = module.network.resource_group_name
  sku_name            = "Standard_AzureFrontDoor"
  tags                = local.tags
}

resource "azurerm_cdn_frontdoor_endpoint" "main" {
  name                     = "${local.name}-fd-endpoint"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  enabled                  = true
  tags                     = local.tags
}

resource "azurerm_cdn_frontdoor_origin_group" "app" {
  name                     = "${local.name}-origin-group"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id

  load_balancing {
    additional_latency_in_milliseconds = 50
    sample_size                        = 4
    successful_samples_required        = 3
  }

  health_probe {
    interval_in_seconds = 120
    path                = "/health"
    protocol            = "Https"
    request_type        = "GET"
  }
}

resource "azurerm_cdn_frontdoor_origin" "app" {
  name                          = "${local.name}-origin-app"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.app.id
  enabled                       = true
  host_name                     = module.app_service.default_hostname
  origin_host_header            = module.app_service.default_hostname
  certificate_name_check_enabled = true
  http_port                      = 80
  https_port                     = 443
  priority                       = 1
  weight                         = 1000
}

resource "azurerm_cdn_frontdoor_route" "app" {
  name                          = "${local.name}-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.main.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.app.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.app.id]
  supported_protocols           = ["Http", "Https"]
  patterns_to_match             = ["/*"]
  forwarding_protocol           = "MatchRequest"
  https_redirect_enabled        = true
  link_to_default_domain        = true
}
