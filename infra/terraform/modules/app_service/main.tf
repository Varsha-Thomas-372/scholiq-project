resource "azurerm_service_plan" "main" {
  name                = "${var.name}-asp"
  resource_group_name = var.resource_group
  location            = var.location_primary
  os_type             = "Linux"
  sku_name            = "B1"   # ✅ FIXED (Student-friendly)
  tags                = var.tags
}

resource "azurerm_linux_web_app" "backend" {
  name                = "${var.name}-api"
  resource_group_name = var.resource_group
  location            = var.location_primary
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true
  tags                = var.tags

  site_config {
    always_on = false   # ✅ FIXED (B1 doesn’t support true)

    application_stack {
      docker_image_name   = "nginx:latest"   # ✅ TEMP SAFE IMAGE
      docker_registry_url = "https://index.docker.io"
    }

    health_check_path   = "/"
    minimum_tls_version = "1.2"
  }

  app_settings = merge(var.backend_env, {
    APPLICATIONINSIGHTS_CONNECTION_STRING = var.app_insights_key
    SQL_CONNECTION_STRING                 = var.sql_connection
    STORAGE_ACCOUNT_NAME                  = var.storage_account
    WEBSITES_PORT                         = "80"
  })
}