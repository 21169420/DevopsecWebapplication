const deleteProduct = (btn) => {
  const productId = btn.parentNode.querySelector("[name=productId]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;
  const card = btn.closest("article");
  fetch("/admin/product/" + productId, {
    method: "DELETE",
    headers: { "csrf-token": csrf },
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      console.log(data);
      card.parentNode.removeChild(card);
    })
    .catch((err) => {
      console.log(err);
    });
};
