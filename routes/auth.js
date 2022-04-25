const express = require("express");
const { check, body } = require("express-validator/check");

const User = require("../models/user");

const {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignUp,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword,
} = require("../controllers/auth");

const router = express.Router();

router.get("/login", getLogin);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter valid email address"),
    body("password", "Password must be valid").isLength({ min: 5 }).trim(),
  ],
  postLogin
);

router.post("/logout", postLogout);

router.get("/signup", getSignup);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter valid email address")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "E-Mail exists already please pick a different one."
            );
          }
        });
      }),
    body(
      "password",
      "password contains only numbers and text values and at least 5 characters"
    )
      .trim()
      .isLength({ min: 5 })
      .isAlphanumeric(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Password have to match");
        }
        return true;
      }),
  ],
  postSignUp
);

router.get("/reset", getReset);

router.post("/reset", postReset);

router.get("/reset/:token", getNewPassword);

router.post("/new-password", postNewPassword);

module.exports = router;
