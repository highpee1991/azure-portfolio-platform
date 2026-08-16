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