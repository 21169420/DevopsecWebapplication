const express = require("express");

//auth middleware
const isAuth = require("../middleware/is-auth");

//controllers
const {
  getIndex,
  getCart,
  getProducts,
  getOrder,
  getProduct,
  postCart,
  postDeleteCartItem,
  postOrder,
  getOrderById,
  getCheckout,
  getCheckoutSuccess,
} = require("../controllers/shop");

const router = express.Router();

router.get("/", getIndex);

router.get("/products", getProducts);

router.get("/products/:productId", getProduct);

router.get("/cart", isAuth, getCart);

router.post("/cart", isAuth, postCart);

router.get("/checkout", isAuth, getCheckout);

router.get("/checkout/success", isAuth, getCheckoutSuccess);

router.get("/checkout/cancel", isAuth, getCheckout);

router.post("/delete-cart-item", isAuth, postDeleteCartItem);

router.get("/order", isAuth, getOrder);

router.post("/order", isAuth, postOrder);

router.get("/order/:orderId", isAuth, getOrderById);

module.exports = router;
