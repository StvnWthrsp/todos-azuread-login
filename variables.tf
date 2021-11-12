variable "tenant_id" {
}

variable "session_secret" {
  default = "keyboardcat"
}

variable "mysql_host" {
  default = "todos-azuread-db"
}

variable "mysql_user" {
  default = "root"
}

variable "mysql_pass" {
  default = "rootpw"
}

variable "mariadb_image_name" {
  default = "todos-azuread-db"
}

variable "mariadb_image_tag" {
  default = "stevenweatherspoon/todos-azuread-db:latest"
}

variable "nodejs_image_name" {
  default = "todos-azuread-app"
}

variable "nodejs_image_tag" {
  default = "stevenweatherspoon/todos-azuread-app:latest"
}