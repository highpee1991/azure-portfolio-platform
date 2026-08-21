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

