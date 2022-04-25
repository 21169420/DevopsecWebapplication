const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

//app assignment
const app = express();

//CSRF(Cross Site Request Protection)
const csrfProtection = csrf();

//multer storage and filtering file type
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//store sessions in database
const MONGODB_URI =
  "mongodb+srv://Sahdev:N2beLeYjf0vIoXAU@nodeapplication.bnn1d.mongodb.net/shop-v2";

const store = new mongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

//User Model
const User = require("./models/user");

//set app's basic needs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static("public"));
app.use("/images", express.static("images"));

//routes
const shopRouter = require("./routes/shop");
const adminRouter = require("./routes/admin");
const authRouter = require("./routes/auth");
const { get404, get500 } = require("./controllers/404");

app.use(
  session({
    secret: "my best secret yet",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//adding user model to allover using session
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use(shopRouter);
app.use("/admin", adminRouter);
app.use(authRouter);
app.use(get404);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render("page-not-found/500", {
    pageTitle: "Something went wrong",
    path: "/some-thing-went-wrong",
    isAuthenticated: req.session.isLoggedIn,
  });
});

//starting server
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    const PORT = 3000;
    console.log("connected...");
    app.listen(PORT, () => {
      console.log(`server started at ...http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.log(err));
