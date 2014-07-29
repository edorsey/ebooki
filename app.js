#!/usr/bin/env node

/*
 * Wooki, book wiki engine built on Jingo
 * http://github.com/edorsey/wooki
 *
 * Copyright 2014 Eric Dorsey <eric@ericdorsey.com>
 * Released under the MIT license
 */

var express        = require('express')
  , http           = require('http')
  , path           = require('path')
  , passport       = require('passport')
  , Git            = require('./lib/gitmech')
  , Tools          = require('./lib/tools')
  , Config         = require('./lib/config')
  , Components     = require('./lib/components')
  , expValidator   = require('express-validator')
  , gravatar       = require('gravatar')
  , Flash          = require('connect-flash')
  , authentication = require('./utilities/authentication')
  , requireAuthentication = require('./utilities/requireAuthentication')
  , error404 = require('./utilities/error404')
  , wookiWorker = require('./worker/wooki.js');


try {
  Git.setup(Config.get("application.repository"), Config.get("application.docSubdir", ""));
} catch(e) {
  console.log(e.message)
  process.exit(-1);
}

// Global variables to be accessed from the routes module
global.app = express();
app.locals.Git = Git;
app.locals.Components = Components;
app.locals.appTitle = Config.get("application.title", "Wooki");
app.locals.port = Config.get("server.port", process.env.PORT || 6067);
app.locals.hostname = Config.get("server.hostname", "localhost");
app.locals.features = Config.get("features", {});

// For backward compatibility with version < 0.5, we set markitup as the
// default rich editor. For new installations, the default is codemirror
if (typeof app.locals.features.codemirror == 'undefined' &&
    typeof app.locals.features.markitup == 'undefined') {
  app.locals.features.markitup = true;
}

// This should never happen, of course
if (app.locals.features.markitup &&
    app.locals.features.codemirror) {
  app.locals.features.markitup = false;
}

// baseUrl is used as the public url
app.locals.baseUrl = Config.get("server.baseUrl", ("http://" + app.locals.hostname + ":" + app.locals.port));
app.locals.authorization = Config.get("authorization", { anonRead: false, validMatches: ".+" });
app.locals.secret = Config.get("application.secret", "wooki-secret-67");

var refspec = Config.get("application.remote") ? Config.get("application.remote").split(/\s+/) : "";
if (!refspec) {
  app.locals.remote = "";
  app.locals.branch = "";
} else {
  app.locals.remote = refspec[0].trim();
  app.locals.branch = refspec[1] ? refspec[1].trim() : "master";
}

app.locals.pushInterval = Config.get("application.pushInterval") ? parseInt(Config.get("application.pushInterval"), 10) * 1000 : 30000;
app.locals.coalesce = function(value, def) {
  return typeof value === 'undefined' ? def : value;
}
app.locals.pretty = true; // Pretty HTML output from Jade


Components.init(Git);

app.configure(function() {
  app.use(express.errorHandler());
  app.set('port', app.locals.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/bower_components', express.static(__dirname + '/bower_components'));
  app.use(express.logger('default'));
  app.use(express.cookieParser(app.locals.secret));
  app.use(express.cookieSession({ secret: "wooki-" + app.locals.secret, cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }})); // a Month
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(expValidator());
  app.use(express.methodOverride());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(Flash());
  app.use(function (req, res, next) {
    res.locals({
      get user() {
        return req.user;
      },
      isAnonymous: function () {
        return !req.user;
      },
      canSearch: function () {
        return !!req.user || app.locals.authorization.anonRead;
      },
      gravatar: function(email) {
        return gravatar;
      },
      hasSidebar: Components.hasSidebar,
      hasFooter: Components.hasFooter,
      hasCustomStyle: Components.hasCustomStyle,
      hasCustomScript: Components.hasCustomScript,
      hasFeature: function(feature) {
        return !!app.locals.features[feature]
      }
    });

    next();
  });

  // Logic to include custom _footer, _sidebar, _script and _style.css
  app.use(function (req, res, next) {

    if (null === req.url.match(/^\/auth\//) &&
        null === req.url.match(/^\/misc\//) &&
        null === req.url.match(/^\/login/)) {
      Components.sidebar(function(content) { res.locals._sidebar = content; });
      Components.footer(function(content) { res.locals._footer = content; });
    }

    res.locals._style  = Components.customStyle();
    res.locals._script = Components.customScript();

    next();
  });

  app.use(app.router);
});

authentication(app);

var routes = require("./routes");
var things = require("./things");

app.all("/pages/*", requireAuthentication);

if (!app.locals.authorization.anonRead) {
  app.all("/wiki/*", requireAuthentication);
  app.all("/search", requireAuthentication);
}

app.all('*', error404);

http.createServer(app).listen(app.get('port'), function(){
  console.log(("Wooki server listening on port " + app.get('port')));
});

if (app.locals.remote != "") {
  setInterval(function() {
    Git.pull(app.locals.remote, app.locals.branch, function(err) {
      if (err) {
        console.log("Error: " + err);
      } else {
        Git.push(app.locals.remote, app.locals.branch, function(err) {
          if (err) {
            console.log("Error: " + err);
          }
        });
      }
    });
  }, app.locals.pushInterval);
}
