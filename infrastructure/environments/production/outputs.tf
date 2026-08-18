output "resource_group_name" {
  value = module.storage_account.resource_group_name
}

output "storage_account_name" {
  value = module.storage_account.storage_account_name
}

output "primary_web_host" {
  value = module.storage_account.primary_web_host
}

output "frontdoor-url" {
  value = module.frontdoor.frontdoor-url
}

output "custom_domain_validation_token" {
  value = module.custom-domain.custom_domain_validation_token
}


output "www_custom_domain_validation_token" {
  value = module.custom-domain.www_custom_domain_validation_token
}