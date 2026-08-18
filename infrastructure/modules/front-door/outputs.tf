output "frontdoor-url" {
  value = azurerm_cdn_frontdoor_endpoint.fdendpoint.host_name
}

output "cdn_frontdoor_profile_id" {
  value = azurerm_cdn_frontdoor_profile.fdprofile.id
}