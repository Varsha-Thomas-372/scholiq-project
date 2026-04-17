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