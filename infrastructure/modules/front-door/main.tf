resource "azurerm_cdn_frontdoor_profile" "fdprofile" {
  name                = var.frontdoor_profile_name
  resource_group_name = var.resource_group_name
  sku_name            = var.sku_name
}

resource "azurerm_cdn_frontdoor_endpoint" "fdendpoint" {
  name                     = var.frontdoor_endpoint_name
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fdprofile.id
}

resource "azurerm_cdn_frontdoor_origin_group" "fdoriginggroup" {
  name                     = var.frontdoor_origin_group_name
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fdprofile.id
  session_affinity_enabled = false

  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
  }

  health_probe {
    interval_in_seconds = 240
    path                = "/"
    protocol            = "Https"
    request_type        = "HEAD"
  }
}

resource "azurerm_cdn_frontdoor_origin" "fdorigin" {
  name                          = var.frontdoor_origin_name
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.fdoriginggroup.id
  enabled                       = true

  certificate_name_check_enabled = true

  host_name          = var.host_name
  http_port          = 80
  https_port         = 443
  origin_host_header = var.origin_host_header
  
}

resource "azurerm_cdn_frontdoor_route" "route" {
  name                          = var.route_name
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.fdendpoint.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.fdoriginggroup.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.fdorigin.id]
  patterns_to_match             = ["/*"]
  supported_protocols           = ["Http", "Https"]
}