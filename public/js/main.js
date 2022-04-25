const burgerMenu = document.querySelector(".burger-menu");
const links = document.querySelector(".mobile-links");
const navBar = document.querySelector(".nav-bar-mobile");
const navBarBig = document.querySelector(".nav-bar");

burgerMenu.addEventListener("click", () => {
  burgerMenu.classList.toggle("activated");
  links.classList.toggle("activated-links");
});

window.addEventListener("scroll", (event) => {
  let scroll = this.scrollY;
  if (scroll > 80) {
    navBarBig.classList.add("position-sticky");
    navBar.classList.add("position-sticky");
  } else {
    navBarBig.classList.remove("position-sticky");
    navBar.classList.remove("position-sticky");
  }
});

const showDiv = () => {
  const errorDiv = document.querySelector(".error-message");
  errorDiv.style.visibility = "visible";
  errorDiv.style.display = "block";
};

setTimeout("showDiv()", 50);

const hideDiv = () => {
  const errorDiv = document.querySelector(".error-message");
  errorDiv.style.visibility = "hidden";
  errorDiv.style.display = "none";
  console.log(errorDiv);
};

setTimeout("hideDiv()", 5000);

//password view

let openEye = document.querySelector(".view-password");
let password = document.querySelector(".password");

openEye.addEventListener("click", () => {
  if (password.attributes["type"].value === "password") {
    password.attributes["type"].value = "text";
    openEye.classList.add("fa-eye-slash");
    openEye.classList.remove("fa-eye");
  } else {
    password.attributes["type"].value = "password";
    openEye.classList.add("fa-eye");
    openEye.classList.remove("fa-eye-slash");
  }
});

//confirm password view

let openConfirmEye = document.querySelector(".view-confirm-password");
let confirmPassword = document.querySelector(".confirm-password");

openConfirmEye.addEventListener("click", () => {
  if (confirmPassword.attributes["type"].value === "password") {
    openConfirmEye.classList.add("fa-eye-slash");
    openConfirmEye.classList.remove("fa-eye");
    confirmPassword.attributes["type"].value = "text";
  } else {
    openConfirmEye.classList.add("fa-eye");
    openConfirmEye.classList.remove("fa-eye-slash");
    confirmPassword.attributes["type"].value = "password";
  }
});
