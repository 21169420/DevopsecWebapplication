exports.get404 = (req, res, next) => {
  res.status(404).render("page-not-found/404", {
    pageTitle: "Page Not Found",
    path: "/page-not-found",
    isAuthenticated: req.session.isLoggedIn,
  });
};

exports.get500 = (req, res, next) => {
  res.status(500).render("page-not-found/500", {
    pageTitle: "Something went wrong",
    path: "/some-thing-went-wrong",
    isAuthenticated: req.session.isLoggedIn,
  });
};
