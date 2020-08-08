const express = require('express');
const expressSession = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const util = require('util');
const config = require ('./config');

var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

passport.serializeUser( (user, done) => {
	done(null, user.oid);
});

passport.deserializeUser( (oid, done) => {
	findByOid(oid, (err, user) => {
		done(err, user);
	});
});

var users = [];

var findByOid = function(oid, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
   console.log('we are using user: ', user);
    if (user.oid === oid) {
      return fn(null, user);
    }
  }
  return fn(null, null);
};

passport.use(new OIDCStrategy({
    identityMetadata: config.creds.identityMetadata,
    clientID: config.creds.clientID,
    responseType: config.creds.responseType,
    responseMode: config.creds.responseMode,
    redirectUrl: config.creds.redirectUrl,
    allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
    clientSecret: config.creds.clientSecret,
    validateIssuer: config.creds.validateIssuer,
    isB2C: config.creds.isB2C,
    issuer: config.creds.issuer,
    passReqToCallback: config.creds.passReqToCallback,
    scope: config.creds.scope,
    loggingLevel: config.creds.loggingLevel,
    loggingNoPII: config.creds.loggingNoPII,
    nonceLifetime: config.creds.nonceLifetime,
    nonceMaxAmount: config.creds.nonceMaxAmount,
    useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
    cookieSameSite: config.creds.cookieSameSite, // boolean
    cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
    clockSkew: config.creds.clockSkew,
  },
  function(iss, sub, profile, accessToken, refreshToken, done) {
    if (!profile.oid) {
      return done(new Error("No oid found"), null);
    }
    // asynchronous verification, for effect...
    process.nextTick(function () {
      findByOid(profile.oid, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          // "Auto-registration"
          users.push(profile);
          return done(null, profile);
        }
        return done(null, user);
      });
    });
  }
));

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(methodOverride());
app.use(cookieParser());

app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended : true }));

function ensureAuthenticated(req, res, next) {
	if( req.isAuthenticated() ) { return next(); }
	res.redirect('/login');
};

app.get('/', (req, res) => {
	res.render('index', { user: req.user });
});

app.get('/login', (req, res, next) => {
		passport.authenticate('azuread-openidconnect', 
			{
				response: res,
				//resourceURL: config.resourceURL,
				failureRedirect: '/'
			}
		)(req, res, next);
	},
	(req, res) => {
		console.log('Login called');
		res.redirect('/');
	}
);

app.get('/auth/openid/return', (req, res, next) => {
		passport.authenticate('azuread-openidconnect', 
			{
				response: res,
				failureRedirect: '/'
			}
		)(req, res, next);
	},
	(req, res) => {
		console.log('Return from AzureAD');
		res.redirect('/');
	}
);

app.post('/auth/openid/return', (req, res, next) => {
		passport.authenticate('azuread-openidconnect', 
			{
				response: res,
				failureRedirect: '/'
			}
		)(req, res, next);
	},
	(req, res) => {
		console.log('Return from AzureAD');
		res.redirect('/');
	}
);

app.listen(3000, () => {
	console.log('Listening on port 3000');
});