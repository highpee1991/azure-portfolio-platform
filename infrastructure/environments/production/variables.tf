variable "resource_group_name" {}
variable "resource_group_location" {}
variable "storage_account_name" {}

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "admin_username" {
  type = string
}

variable "sku_name" {
  type = string
}

variable "frontdoor_profile_name" {
  type = string
}

variable "frontdoor_endpoint_name" {
  type = string
}

variable "frontdoor_origin_group_name" {
  type = string
}

variable "frontdoor_origin_name" {
  type = string
}


variable "route_name" {
  type = string
}


variable "frontdoor_custom_domain" {
  type = string
}


variable "custom_domain_host_name" {
  type = string
}

variable "www_custom_domain_host_name" {
  type = string
}