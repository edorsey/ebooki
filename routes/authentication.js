var passport = require('passport');

module.exports = function(app) {

  app.get("/auth/done", function(req, res) {

    if (!res.locals.user) {
      res.redirect("/");
      return;
    }

    if (!app.locals.authentication.alone.used && !Tools.isAuthorized(res.locals.user.email, app.locals.authorization.validMatches)) {
      req.logout();
      req.session = null;
      res.statusCode = 403;
      res.end('<h1>Forbidden</h1>');
    } else {
      var dst = req.session.destination || "/";
      delete req.session.destination;
      res.redirect(dst);
    }
  });

  /*
  * GET Login page.
  */

  app.get("/login",function(req, res) {

    req.session.destination = req.query.destination; // (req.headers.referer ? Url.parse(req.headers.referer).path : null);

    if (req.session.destination == '/login') {
      req.session.destination = '/';
    }

    res.locals.errors = req.flash();

    res.render('login', {
      title: app.locals.appTitle,
      auth: app.locals.authentication
    });
  });

  app.post("/login", passport.authenticate('local', { 
    successRedirect: '/auth/done', 
    failureRedirect: '/login', 
    failureFlash: true 
  }));

  app.get("/logout", function(req, res) {
    req.logout();
    req.session = null;
    res.redirect('/');
  });

  app.get("/auth/google", passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/userinfo.email'] }
  ));

  app.get("/oauth2callback", passport.authenticate('google', { 
    successRedirect: '/auth/done', 
    failureRedirect: '/login' 
  }));

}