function removeTodos() {
  var todos = document.getElementsByClassName('todo-item');
  Array.from(todos).forEach((item, i) => {
    if (item.checked) {
      $.ajax({
        url: '/todos/remove',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ item: item.parentNode.textContent.trim() }),
        success: function(data) {
          item.parentNode.remove();
        }
      });
    }
  });
}
