# Steven Weatherspoon, 2021
# Provisions resourrces in Microsoft Azure AD ready for use with the ToDos application in this repository.

# Configure Terraform
terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.8.0"
    }
  }
}

# Configure the Azure Active Directory Provider
provider "azuread" {
  tenant_id = var.tenant_id
}

# Retrieve client config information
data "azuread_client_config" "current" {}

# Retrieve domain information
data "azuread_domains" "primary_domain" {
  only_initial = true
}

resource "random_uuid" "uuid" {}

# Create an application
resource "azuread_application" "todos" {
  display_name = "TodosApp"
  owners           = [data.azuread_client_config.current.object_id]
  group_membership_claims = ["All"]

  web {
      redirect_uris = ["http://localhost:3000/auth/oauth2/return"]
      logout_url = "https://localhost:3000/logout"
      implicit_grant {
        id_token_issuance_enabled = true
      }
  }
  public_client {
      redirect_uris = ["http://localhost:3000/"]
  }
}

# Create client secret for application
resource "azuread_application_password" "todos" {
  application_object_id = azuread_application.todos.object_id
  end_date = "2099-12-31T00:00:00Z"
}

# Create a service principal
resource "azuread_service_principal" "sp" {
  application_id = azuread_application.todos.application_id
}

# Create some users
resource "azuread_user" "user1" {
  user_principal_name = "TestUser@${data.azuread_domains.primary_domain.domains.0.domain_name}"
  display_name        = "Test User"
  password            = "Pa55w0rd!"
}

resource "azuread_user" "user2" {
  user_principal_name = "JohnDoe@${data.azuread_domains.primary_domain.domains.0.domain_name}"
  display_name        = "John Doe"

  password            = "Pa55w0rd!"
}

resource "azuread_user" "user3" {
  user_principal_name = "JaneDoe@${data.azuread_domains.primary_domain.domains.0.domain_name}"
  display_name        = "Jane Doe"
  password            = "Pa55w0rd!"
}

resource "azuread_user" "user4" {
  user_principal_name = "JohnSmith@${data.azuread_domains.primary_domain.domains.0.domain_name}"
  display_name        = "John Smith"
  password            = "Pa55w0rd!"
}

# Create a group
resource "azuread_group" "todos" {
  display_name     = "todos_group"
  security_enabled = true
  owners           = [data.azuread_client_config.current.object_id]
  members          = [azuread_user.user1.object_id, azuread_user.user2.object_id, azuread_user.user3.object_id, azuread_user.user4.object_id]
}

module "database" {
  source = "./modules/database"
}