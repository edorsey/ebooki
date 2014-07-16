module.exports = function(req, res) {
  res.locals.title = "404 - Not found";
  res.statusCode = 404;
  res.render('404.jade');
}