const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator/check");

//User Model
const User = require("../models/user");

// # ------------------
// # Include the Sendinblue library\
const SibApiV3Sdk = require("sib-api-v3-sdk");
const defaultClient = SibApiV3Sdk.ApiClient.instance;

//Instantiate the client
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey =
  "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";

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    errorMessage: "",
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Sign-Up",
    path: "/signup",
    errorMessage: req.flash("error"),
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      path: "/login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        res.render("auth/login", {
          pageTitle: "Login",
          path: "/login",
          errorMessage: "Invalid email or password",
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
      }
      return bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          return res.render("auth/login", {
            pageTitle: "Login",
            path: "/login",
            errorMessage: "Invalid email or password",
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [],
          });
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          next(error);
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

exports.postSignUp = (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  //looking for check middleware in this post req
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      pageTitle: "Sign-Up",
      path: "/signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }
  return bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      res.redirect("/login");
      sendSmtpEmail.subject = "My {{params.subject}}";
      sendSmtpEmail.htmlContent =
        "<html><body><h1>Welcome to Node-Shop!</h1></br><h2>Hello User</h2></br><p>now please login to the website create some products buy some if you want and yes, Enjoy</p></br><h2>Thank you.</h2></br><h3>Stay Connected | Stay Updated</h3></body></html>";
      sendSmtpEmail.sender = {
        name: "Node - Shop",
        email: "nodeshop.r050@gmail.com",
      };
      sendSmtpEmail.to = [{ email: email }];
      sendSmtpEmail.headers = {
        "node-shop-user-smtp-email": "unique-id-1234",
      };
      sendSmtpEmail.params = {
        parameter: "My param value",
        subject: "Sucessfully Sign-Up",
      };

      apiInstance.sendTransacEmail(sendSmtpEmail).then(
        function (data) {
          console.log(
            "API called successfully. Returned data: " + JSON.stringify(data)
          );
        },
        function (err) {
          const error = new Error(err);
          error.httpStatusCode = 500;
          next(error);
        }
      );
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    pageTitle: "Reset Password",
    path: "/reset",
    errorMessage: req.flash("error"),
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buf) => {
    if (err) {
      console.log("error is here");
      return res.redirect("/reset");
    }
    const token = buf.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email-id found !");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user
          .save()
          .then((result) => {
            res.redirect("/");
            sendSmtpEmail.subject = "{{params.subject}}";
            sendSmtpEmail.htmlContent = `
            <html>
              <body>
                <h1>Reset Password !</h1>
                <p>if you've lost your password</p>
                <p>Dont worry click on the link given below.</p>
                <a style="color:white;width:fit-content;display:block;margin:2rem 0;background:rgb(63, 141, 230);padding:0.6rem 1.5rem;border-radius:12px;text-decoration:none;" href='http://localhost:3000/reset/${token}'>Click Here</a>
                <p>if you did not request for reset, you can safely ignore this emaill,</p>
                <p>Only a person with access your email can reset your password.</p>
              </body>
            </html>
          `;
            sendSmtpEmail.sender = {
              name: "Node - Shop",
              email: "nodeshop.r050@gmail.com",
            };
            sendSmtpEmail.to = [{ email: req.body.email }];
            sendSmtpEmail.headers = {
              "node-shop-user-smtp-email": "unique-id-12345",
            };
            sendSmtpEmail.params = {
              parameter: "My param value",
              subject: "Reset Password",
            };

            apiInstance.sendTransacEmail(sendSmtpEmail).then(
              function (data) {
                console.log(
                  "API called successfully. Returned data: " +
                    JSON.stringify(data)
                );
              },
              function (err) {
                const error = new Error(err);
                error.httpStatusCode = 500;
                next(error);
              }
            );
          })
          .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error);
          });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      res.render("auth/new-password", {
        pageTitle: "New Password",
        path: "/new-password",
        errorMessage: req.flash("error"),
        userId: user._id.toString(),
        resetToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const { userId, resetToken, newPassword } = req.body;
  console.log(newPassword);
  let resetUser;
  User.findOne({
    _id: userId,
    resetToken: resetToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      console.log(resetUser.password);
      console.log(hashedPassword);
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      console.log("password reset successfully");
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};
