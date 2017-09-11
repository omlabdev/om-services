const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sassMiddleware = require('node-sass-middleware');
const mongoose = require('mongoose');

const DB_NAME = 'om', DB_HOST = 'localhost';
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://' + DB_HOST + '/' + DB_NAME);

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.locals.basedir = path.join(__dirname, 'views');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
	src: path.join(__dirname, 'public/stylesheets'),
	dest: path.join(__dirname, 'public/stylesheets'),
	indentedSyntax: false, // true = .sass and false = .scss
	sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// setup api urls & auth
const router = express.Router();
const Api = require('./api/api');

if (Api.auth_on) {
	router.use(require('./api/users').authMiddleware);
}

const apis = ['tasks', 'projects', 'users', 'work_entries', 'objectives', 'activity'];
apis.forEach((api) => { 
	require(`./api/${api}`).setup(router);
})
app.use(Api.root, router);
console.log('currently exposing api v%s at %s', Api.version, Api.root);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
