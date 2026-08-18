output "cdn_frontdoor_custom_domain_ids" {
  value = azurerm_cdn_frontdoor_custom_domain.custom_domain.id
}

output "custom_domain_validation_token" {
  value = azurerm_cdn_frontdoor_custom_domain.custom_domain.validation_token
}


output "www_cdn_frontdoor_custom_domain_ids" {
  value = azurerm_cdn_frontdoor_custom_domain.www_custom_domain.id
}

output "www_custom_domain_validation_token" {
  value = azurerm_cdn_frontdoor_custom_domain.www_custom_domain.validation_token
}