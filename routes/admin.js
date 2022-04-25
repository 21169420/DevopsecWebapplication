const express = require("express");
const { body } = require("express-validator/check");

//auth middleware
const isAuth = require("../middleware/is-auth");

//controllers
const {
  getAddProduct,
  getAdminProducts,
  postAddProduct,
  getEditProduct,
  postEditProduct,
  deleteProduct,
} = require("../controllers/admin");

const router = express.Router();

router.get("/admin-products", isAuth, getAdminProducts);

router.get("/add-product", isAuth, getAddProduct);

router.post(
  "/add-product",
  [
    body("title")
      .isLength({ min: 3 })
      .withMessage("title must contain 3 characters!")
      .isString()
      .trim(),
    body("price").isFloat().withMessage("price must be a number"),
    body("description")
      .isLength({ min: 5, max: 250 })
      .withMessage(
        "description should be minimum 5 characters and maximum 250 characters"
      ),
  ],
  isAuth,
  postAddProduct
);

router.get("/edit-product/:productId", isAuth, getEditProduct);

router.post(
  "/edit-product",
  [
    body("title")
      .isLength({ min: 3 })
      .withMessage("title must contain 3 characters!")
      .isString()
      .trim(),
    body("price").isFloat().withMessage("price must be a number"),
    body("description")
      .isLength({ min: 5, max: 250 })
      .withMessage(
        "description should be minimum 5 characters and maximum 250 characters"
      ),
  ],
  isAuth,
  postEditProduct
);

router.delete("/product/:productId", isAuth, deleteProduct);

module.exports = router;
