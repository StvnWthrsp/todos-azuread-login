# Steven Weatherspoon, 2021
# Provisions resourrces in Microsoft Azure AD and local Docker containers for use with the ToDos application in this repository.

# Configure Terraform
terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.8.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "2.15.0"
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

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

# Create a network
resource "docker_network" "private_network" {
  name = "todos-app-network"
}

# Start a container for mariadb
resource "docker_container" "mariadb" {
  name  = var.mariadb_image_name
  image = var.mariadb_image_tag
  ports {
    internal = 3306
    external = 3306
  }
  networks_advanced {
      name = "todos-app-network"
  }
}

# Start the app container
resource "docker_container" "todos-app" {
  name  = var.nodejs_image_name
  image = var.nodejs_image_tag
  ports {
    internal = 3000
    external = 3000
  }
  networks_advanced {
      name = "todos-app-network"
  }
  env = [
    "SESSION_SECRET=${var.session_secret}",
    "MYSQL_HOST=${var.mysql_host}",
    "MYSQL_USER=${var.mysql_user}",
    "MYSQL_PASS=${var.mysql_pass}",
    "AUTH_URL=https://login.microsoftonline.com/${azuread_application.todos.publisher_domain}/oauth2/v2.0/authorize",
    "TOKEN_URL=https://login.microsoftonline.com/${azuread_application.todos.publisher_domain}/oauth2/v2.0/token",
    "REDIRECT_URL=http://localhost:3000/auth/oauth2/return",
    "CLIENT_ID=${azuread_application.todos.application_id}",
    "CLIENT_SECRET=${azuread_application_password.todos.value}",
    "DESTROY_URL=https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=http://localhost:3000",
    "TODOS_GROUP_ID=${azuread_group.todos.object_id}"
  ]
}