const express = require('express');
const expressSession = require('express-session');
const path = require('path');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const util = require('util');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

const config = require ('./config');
require('dotenv').config();

var con = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
	database: "users"
});

var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
var AzureAdOAuth2Strategy = require('passport-azure-ad-oauth2');

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

passport.use(new AzureAdOAuth2Strategy({
    authorizationURL: config.creds.identityMetadata,
    tokenURL: config.creds.tokenURL,
    clientID: config.creds.clientID,
    responseType: config.creds.responseType,
    responseMode: config.creds.responseMode,
    callbackURL: config.creds.redirectUrl,
    clientSecret: config.creds.clientSecret,
    scope: config.creds.scope,
    state: true,
    pkce: true,
  },
  function(accessToken, refreshToken, params, profile, done) {
    var ad_profile = jwt.decode(params.id_token);
    if (!ad_profile.oid) {
      return done(new Error("No oid found"), null);
    }
    // asynchronous verification, for effect...
    process.nextTick(function () {
      findByOid(ad_profile.oid, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          // "Auto-registration"
          users.push(ad_profile);
          return done(null, ad_profile);
        }
        return done(null, user);
      });
    });
  }
));

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(methodOverride());
app.use(cookieParser());

app.use(expressSession({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended : true }));
app.use(bodyParser.json());

function ensureAuthenticated(req, res, next) {
	if( req.isAuthenticated() ) { return next(); }
	res.redirect('/login');
};

app.get('/', (req, res) => {
	if(!req.user) {
		res.render('index', { user: req.user });
		return;
	}
  if( req.user.groups.includes("cbcb7d7c-a6d5-4ac4-8f0b-a5a601687f3f") ) {
    console.log("User authorized!");
  }
  if( !req.user.groups.includes("cbcb7d7c-a6d5-4ac4-8f0b-a5a601687f3f") ) {
    res.redirect('unauthorized');
    return;
  }
	var statement = 'SELECT * FROM users WHERE oid = "' + req.user.oid + '";';

	con.query(statement, function (err, result) {
		if (err) throw err;
    if (result) {
      res.render('index', { user: req.user, profile: result[0] });
    }
	});
});

app.get('/unauthorized', (req, res) => {
  res.render('unauthorized');
  return;
});

app.get('/todos', (req, res) => {
  if(!req.user) {
    res.render('index', { user: req.user });
    return;
  }

  var statement = 'SELECT * FROM todos WHERE owner_oid = "' + req.user.oid + '";';

	con.query(statement, function (err, result) {
		if (err) throw err;
    if (result) {
      res.render('todo-list', { user: req.user, todos: result });
    }
	});
});

app.post('/todos', (req, res) => {
  if(!req.user) {
    res.render('index', { user: req.user});
    return;
  }

  //var statement = 'INSERT INTO todos (id, item, owner_oid) VALUES ("' + req.body.item.toLowerCase().trim().replace(/ /g, '-') + '", "' + req.body.item + '", "' + req.user.oid + '");';
  var statement = 'INSERT INTO todos (item, owner_oid) VALUES ("' + req.body.item + '", "' + req.user.oid + '");';

  con.query(statement, function (err, result) {
		if (err) throw err;
	});

  statement = 'SELECT * FROM todos WHERE owner_oid = "' + req.user.oid + '";';

  con.query(statement, function (err, result) {
		if (err) throw err;
    if (result) {
      res.render('todo-list', { user: req.user, todos: result });
    }
	});

});

app.post('/todos/remove', (req, res) => {
  if(!req.user) {
    res.render('index', { user: req.user});
    return;
  }
  console.log(req.body);

  var statement = `DELETE FROM todos WHERE item='${req.body.item}'`;

  con.query(statement, function (err, result) {
		if (err) throw err;
    res.sendStatus(200);
	});

});
/*
app.get('/login', (req, res, next) => {
		passport.authenticate('azure_ad_oauth2',
			{
				response: res,
        successRedirect: '/success',
				failureRedirect: '/login'
			}
		)(req, res, next);
	},
	(req, res) => {
		console.log('Login called');
		res.redirect('/');
	}
);
*/
app.get('/login',
 passport.authenticate('azure_ad_oauth2',
  {
    successRedirect: '/success',
    failureRedirect: '/'
  }),
  (req, res, next) => {
		console.log('Return from AzureAD at return');
		res.redirect('/');
	}
);

/*
app.get('/auth/openid/return', (req, res, next) => {
		passport.authenticate('azure_ad_oauth2',
			{
				response: res,
        successRedirect: '/success',
				failureRedirect: '/login'
			}
		)(req, res, next);
	},
	(req, res) => {
		console.log('Return from AzureAD at return');
		res.redirect('/');
	}
);

app.post('/auth/openid/return', (req, res, next) => {
		passport.authenticate('azure_ad_oauth2',
			{
				response: res,
        successRedirect: '/success',
				failureRedirect: '/'
			}
		)(req, res, next);
	},
	(req, res) => {
		console.log('Return from AzureAD at return');
		res.redirect('/');
	}
);
*/
app.get('/auth/openid/return',
 passport.authenticate('azure_ad_oauth2',
 {
    successRedirect: '/',
    failureRedirect: '/login'
  }),
  (req, res, next) => {
		console.log('Return from AzureAD at return');
		res.redirect('/');
	}
);

app.post('/auth/openid/return',
 passport.authenticate('azure_ad_oauth2',
 {
    successRedirect: '/',
    failureRedirect: '/login'
  }),
  (req, res, next) => {
		console.log('Return from AzureAD at return');
		res.redirect('/');
	}
);

app.post('/signup', (req, res) => {
  if(!req.user) {
    res.redirect('/');
  }
  console.log('Posting user to database');

  var statement = 'INSERT INTO users (oid, Name, Age, Sex) VALUES ("' + req.user.oid + '", "' + req.body.fname + '", "' + req.body.age + '", "' + req.body.sex + '");';

	con.query(statement, function (err, result) {
		if (err) throw err;
    console.log(result);
	});

	res.redirect('/');
});

app.get('/logout', function(req, res){
  req.session.destroy(function(err) {
    req.logOut();
    res.redirect(config.destroySessionUrl);
  });
});

app.listen(3000, () => {
	console.log('Listening on port 3000');

  // Keep the mysql connection alive by querying on a 1 hour interval
  setInterval( () => { con.query('SELECT 1;', function(err, result) { if (err) console.log(err) }) } , 3600000);
});
