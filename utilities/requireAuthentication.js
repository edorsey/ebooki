
module.exports = function(req, res, next) {
  if (!res.locals.user) {
    res.redirect("/login");
  } else {
    next();
  }
}