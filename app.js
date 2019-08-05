const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const Scheduler = require('./lib/scheduler');
const ScheduledJobs = require('./lib/scheduled-jobs');

Scheduler.runEvery('0.5 days', ScheduledJobs.cleanEbooks);

const AppErrors = require('./lib/app-errors');
const index = require('./routes/index');
const users = require('./routes/users');
const booksBeta = require('./routes/api/books-beta');
const booksV1 = require('./routes/api/books-v1');
const version = require('./routes/api/version');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
if (process.env.NODE_ENV !== 'test') {
    app.use(logger('dev'));
} else {
    Scheduler.clearIntervals();
}

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
    if (err) {
        const apiError = AppErrors.getApiError(err);
        AppErrors.respondWithError(res, apiError);
    } else {
        next();
    }
});
const allowCrossDomain = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

app.use(allowCrossDomain);

app.use('/', index);
app.use('/users', users);
app.use('/api/books', booksBeta);
app.use('/api/v1/books', booksV1);
app.use('/api/version', version);
app.use('/api/v1/version', version);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
    });
});

module.exports = app;
