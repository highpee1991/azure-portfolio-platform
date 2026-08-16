terraform {
  backend "azurerm" {
    resource_group_name  = "portfolio-tfstate-rg"
    storage_account_name = "portfoliotfstatestorage"
    container_name       = "portfolio-tfstate-container"
    key                  = "production.tfstate"
  }
}