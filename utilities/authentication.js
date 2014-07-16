var passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  	LocalStrategy  = require('passport-local').Strategy,
	Config = require('./../lib/config');



module.exports = function(app) {

	var auth = Config.get("authentication", { google: { enabled: true }, alone: { enabled: false } });

	auth.google = auth.google || {enabled: false};
	auth.alone  = auth.alone  || {enabled: false};

	if ( !auth.google.enabled && !auth.alone.enabled ) {
	  console.log("Error: no authentication method provided. Cannot continue.");
	  process.exit(-1);
	}

	if (auth.google.enabled && (!auth.google.clientId || !auth.google.clientSecret)) {
		console.log(Config);
	  console.log("Error: invalid or missing authentication credentials for Google (clientId and/or clientSecret).");
	  process.exit(-1);
	}
	
	app.locals.authentication = auth;

	function usedAuthentication(name) {
	  for (var a in app.locals.authentication) {
	    app.locals.authentication[a].used = (a == name);
	  }
	}

	/*
	 * Passport configuration
	 */

	if (auth.google.enabled) {

	  passport.use(new GoogleStrategy({
	      clientID: auth.google.clientId,
	      clientSecret: auth.google.clientSecret,
	      // I will leave the horrible name as the default to make the painful creation
	      // of the client id/secret simpler
	      callbackURL: app.locals.baseUrl + '/oauth2callback'
	    },

	    function(accessToken, refreshToken, profile, done) {
	      usedAuthentication("google");
	      done(null, profile);
	    }
	  ));
	}

	if (auth.alone.enabled) {

	  passport.use(new LocalStrategy(

	    function(username, password, done) {

	      var user = {
	        displayName: auth.alone.username,
	        email: auth.alone.email || ""
	      };

	      if (username.toLowerCase() != auth.alone.username.toLowerCase() || Tools.hashify(password) != auth.alone.passwordHash) {
	        return done(null, false, { message: 'Incorrect username or password' });
	      }

	      usedAuthentication("alone");

	      return done(null, user);
	    }
	  ));
	}

	passport.serializeUser(function(user, done) {
	  done(null, user);
	});

	passport.deserializeUser(function(user, done) {
	  if (user.emails && user.emails.length > 0) { // Google
	    user.email = user.emails[0].value;
	    delete user.emails;
	  }
	  user.asGitAuthor = user.displayName + " <" + user.email + ">";
	  done(undefined, user);
	});
	
}