const gulp = require('gulp');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const args = require('yargs').argv;

const options = { reporter: 'spec', harmony: true, grep: args.regex || '.' };

gulp.task('pre-test', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src(['lib/**/*.js', 'models/*.js', 'routes/**/*.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], () =>
    gulp.src('./tests/**/*-test.js', { read: false })
        .pipe(mocha(options))
        .pipe(istanbul.writeReports())
);

gulp.task('test-db', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src('./tests/models/*-test.js', { read: false })
    .pipe(mocha(options));
});

gulp.task('test-unit', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src('./tests/*-test.js', { read: false })
    .pipe(mocha(options));
});

gulp.task('test-integration', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src('./tests/integration/**/*-test.js', { read: false })
    .pipe(mocha(options));
});

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    // application specific logging, throwing an error, or other logic here
});
