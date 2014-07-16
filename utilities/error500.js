module.exports = function(req, res, message) {
  res.locals.title = "500 - Internal server error";
  res.statusCode = 500;
  res.render('500.jade', {
    error: message
  });
}
