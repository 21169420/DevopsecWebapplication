const Product = require("../models/product");
const Order = require("../models/order");

const stripe = require("stripe")(
  "sk_test_51K0owJSHmz9cP8kpGx4an91hslc3ADPOxQA4jUuEUES89nf8RjWziaMDWADHQKk5e2CcQZiodAGd7xP2v2ZxOquo00bCgeqlab"
);

const PDFDocument = require("pdfkit");

const path = require("path");
const fs = require("fs");

const ITEM_PER_PAGE = 2;

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        pageTitle: "Shop",
        path: "/",
        products: products,
        currentPage: page,
        hasNextPage: ITEM_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/products", {
        pageTitle: "Products",
        path: "/products",
        products: products,
        currentPage: page,
        hasNextPage: ITEM_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const { productId } = req.params;
  Product.findById(productId)
    .then((product) => {
      res.render("shop/product", {
        pageTitle: product.title,
        path: "/products",
        product: product,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};
exports.getCheckout = (req, res, next) => {
  let products,
    total = 0;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      products.map((prod) => {
        total += prod.quantity * prod.productId.price;
      });
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((prod) => {
          return {
            name: prod.productId.title,
            description: prod.productId.description,
            amount: prod.productId.price * 100,
            currency: "usd",
            quantity: prod.quantity,
          };
        }),
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        pageTitle: "Checkout",
        path: "/checkout",
        products: products,
        totalCost: total,
        sessionId: session.id,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postCart = (req, res, next) => {
  const { productId } = req.body;
  Product.findById(productId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log("Product Added To Cart Successfully...");
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postDeleteCartItem = (req, res, next) => {
  const { productId } = req.body;
  req.user
    .deleteCartItem(productId)
    .then((result) => {
      console.log("Cart Item Delete Successfully...");
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getOrder = (req, res, next) => {
  Order.find({ "user.userId": req.session.user._id })
    .then((orders) => {
      res.render("shop/order", {
        pageTitle: "Order",
        path: "/order",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((item) => {
        return { quantity: item.quantity, product: { ...item.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.session.user.email,
          userId: req.session.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then((result) => {
      console.log("Items Added to Order Successfully...");
      res.redirect("/order");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((item) => {
        return { quantity: item.quantity, product: { ...item.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.session.user.email,
          userId: req.session.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then((result) => {
      console.log("Items Added to Order Successfully...");
      res.redirect("/order");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getOrderById = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No Order Found!"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unothorized!"));
      }
      const invoiceName = "Invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument({ margin: 30, size: "A4" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(25).text("Invoice", {
        width: 500,
        align: "center",
      });
      pdfDoc
        .moveTo(50, 60) // set the current point
        .lineTo(550, 60)
        .lineWidth(3)
        .lineCap("round")
        .stroke();

      pdfDoc.moveTo(50, 105).lineTo(270, 105).lineWidth(1).stroke();

      pdfDoc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Product Name", 50, 90)
        .text("Quantity", 150, 90)
        .text("Price", 225, 90)
        .stroke();

      let invoiceTableTop = 85;
      let invoiceTableTopLine = 105;
      let total = 0;
      order.products.forEach((prod, index) => {
        pdfDoc
          .fontSize(12)
          .font("Helvetica")
          .text(prod.product.title, 50, invoiceTableTop + (index + 1) * 30)
          .text(prod.quantity, 155, invoiceTableTop + (index + 1) * 30)
          .text(
            `$ ${prod.product.price}`,
            225,
            invoiceTableTop + (index + 1) * 30
          )
          .moveTo(50, invoiceTableTopLine + (index + 1) * 30)
          .lineTo(270, invoiceTableTopLine + (index + 1) * 30)
          .lineWidth(1)
          .stroke();
        total += prod.quantity * prod.product.price;
      });
      pdfDoc.moveDown();
      pdfDoc.moveDown();
      pdfDoc.fontSize(15).text(`Total : $${total}`, 50);
      pdfDoc.end();
    })
    .catch((err) => next(err));
};
