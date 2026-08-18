locals {
  name_prefix = "${var.project_name}-${var.environment}"
  tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = var.admin_username
    ManagedBy   = "Terraform"
  }
}

resource "azurerm_resource_group" "prod-rg" {
  name     = var.resource_group_name
  location = var.resource_group_location

  tags = local.tags
}

module "storage_account" {
  source = "../../modules/storage"

  resource_group_name     = azurerm_resource_group.prod-rg.name
  resource_group_location = azurerm_resource_group.prod-rg.location
  storage_account_name    = var.storage_account_name
}

module "frontdoor" {
  source = "../../modules/front-door"

  resource_group_name             = azurerm_resource_group.prod-rg.name
  sku_name                        = var.sku_name
  frontdoor_profile_name          = var.frontdoor_profile_name
  frontdoor_endpoint_name         = var.frontdoor_endpoint_name
  frontdoor_origin_group_name     = var.frontdoor_origin_group_name
  frontdoor_origin_name           = var.frontdoor_origin_name
  host_name                       = module.storage_account.primary_web_host
  origin_host_header              = module.storage_account.primary_web_host
  route_name                      = var.route_name
  cdn_frontdoor_custom_domain_ids = module.custom-domain.cdn_frontdoor_custom_domain_ids
  www_cdn_frontdoor_custom_damain_ids = module.custom-domain.www_cdn_frontdoor_custom_domain_ids
}

module "custom-domain" {
  source = "../../modules/custom-domain"

  frontdoor_custom_domain     = var.frontdoor_custom_domain
  cdn_frontdoor_profile_id    = module.frontdoor.cdn_frontdoor_profile_id
  custom_domain_host_name     = var.custom_domain_host_name
  www_custom_domain_host_name = var.www_custom_domain_host_name
}