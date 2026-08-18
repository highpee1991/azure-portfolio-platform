resource "azurerm_cdn_frontdoor_custom_domain" "custom_domain" {
  name                     = var.frontdoor_custom_domain
  cdn_frontdoor_profile_id = var.cdn_frontdoor_profile_id
  host_name                = var.custom_domain_host_name

  tls {
    certificate_type = "ManagedCertificate"
  }
}

resource "azurerm_cdn_frontdoor_custom_domain" "www_custom_domain" {
  name                     = "${var.frontdoor_custom_domain}-www"
  cdn_frontdoor_profile_id = var.cdn_frontdoor_profile_id
  host_name                = var.www_custom_domain_host_name

  tls {
    certificate_type = "ManagedCertificate"
  }
}