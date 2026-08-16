resource "azurerm_storage_account" "storage_account" {
  name                = var.storage_account_name
  resource_group_name = var.resource_group_name
  location            = var.resource_group_location


  account_tier             = "Standard"
  account_replication_type = "GRS"
}

resource "azurerm_storage_account_static_website" "static-web" {
  storage_account_id = azurerm_storage_account.storage_account.id
  error_404_document = "404.html"
  index_document     = "index.html"
}

locals {
  portfolio_files = fileset("${path.module}/../../../portfolio", "**")
}


resource "azurerm_storage_blob" "portfolio" {
  for_each = local.portfolio_files

  name                 = each.value
  storage_container_id = "${azurerm_storage_account.storage_account.id}/blobServices/default/containers/$web"

  type        = "Block"
  source      = "${path.module}/../../../portfolio/${each.value}"
  content_md5 = filemd5("${path.module}/../../../portfolio/${each.value}")

  content_type = lookup(
    {
      html = "text/html"
      css  = "text/css"
      js   = "application/javascript"
      png  = "image/png"
      jpg  = "image/jpeg"
      jpeg = "image/jpeg"
      svg  = "image/svg+xml"
      json = "application/json"
      ico  = "image/x-icon"
      webp = "image/webp"
      md   = "text/markdown"
      pdf  = "application/pdf"
    },
    try(lower(regex("[^.]+$", each.value)), ""),
    "application/octet-stream"
  )
}

