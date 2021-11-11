# Steven Weatherspoon, 2021
# Provisions a MariaDB Docker container pre-configured for the ToDos app. Must build the image first from the /database directory of the repo.
# docker build . -t todos-azuread-db:0.1

terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "2.15.0"
    }
  }
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
  env = ["SESSION_SECRET=${var.session_secret}", "MYSQL_HOST=${var.mysql_host}", "MYSQL_USER=${var.mysql_user}", "MYSQL_PASS=${var.mysql_pass}"]
}