output "frontdoor-url" {
  value = azurerm_cdn_frontdoor_endpoint.fdendpoint.host_name
}