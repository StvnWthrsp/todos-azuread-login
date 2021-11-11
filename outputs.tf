output "secret_id" {
  value = azuread_application_password.todos.key_id
}

output "client_secret" {
  value = azuread_application_password.todos.value
  sensitive = true
}

output "app_client_id" {
    value = azuread_application.todos.application_id
}

output "tenant_id" {
    value = azuread_application.todos.publisher_domain
}

output "todos_group_id" {
    value = azuread_group.todos.object_id
}