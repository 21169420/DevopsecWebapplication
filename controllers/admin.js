const Product = require("../models/product");
//experiment purpose
//----------------------------------
const mongoose = require("mongoose");
//-----------------------------------
const { validationResult } = require("express-validator/check");

//delete file
const fileHelper = require("../utils/file");

exports.getAdminProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render("admin/admin-products", {
        pageTitle: "Admin-Products",
        path: "/admin/admin-products",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-products", {
    pageTitle: "Add-Product",
    path: "/admin/add-product",
    editing: false,
    hasErrors: false,
    errorMessage: "",
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const { title, price, description } = req.body;
  const image = req.file;
  const errors = validationResult(req);
  if (!image) {
    return res.status(422).render("admin/edit-products", {
      pageTitle: "Add-Product",
      path: "/admin/add-product",
      editing: false,
      hasErrors: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: "Attached file is not in image format!",
      validationErrors: [],
    });
  }
  const product = new Product({
    title: title,
    imageUrl: image.path,
    price: price,
    description: description,
    userId: req.session.user,
  });
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-products", {
      pageTitle: "Add-Product",
      path: "/admin/add-product",
      editing: false,
      hasErrors: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  product
    .save()
    .then((result) => {
      console.log("Product Added Successfully....");
      res.redirect("/");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const { productId } = req.params;
  const { edit } = req.query;
  Product.findById(productId)
    .then((product) => {
      res.render("admin/edit-products", {
        pageTitle: "Edit Product",
        path: "admin/admin-products",
        editing: edit,
        product: product,
        hasErrors: false,
        errorMessage: "",
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const { title, price, description, productId } = req.body;
  const image = req.file;
  const errors = validationResult(req);
  Product.findById(productId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-products", {
          pageTitle: "Edit Product",
          path: "admin/admin-products",
          editing: true,
          product: {
            title: title,
            price: price,
            description: description,
            _id: productId,
          },
          hasErrors: true,
          errorMessage: errors.array()[0].msg,
          validationErrors: errors.array(),
        });
      }
      product.title = title;
      product.price = price;
      product.description = description;
      product.userId = req.session.user;
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      product.save().then((result) => {
        console.log("Product Update Successfully...");
        res.redirect("/admin/admin-products");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const { productId } = req.params;
  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not Found!"));
      }
      console.log(product);
      fileHelper.deleteFile(product.imageUrl);
    })
    .catch((err) => next(err));
  Product.deleteOne({ _id: productId, userId: req.user._id })
    .then((result) => {
      res.status(200).json({ message: "Product Delete Successfully..." });
    })
    .catch((err) => {
      res.status(500).json({ message: "Failed to delete the product" });
    });
};
