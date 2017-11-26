const gulp = require('gulp');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const sequence = require('gulp-sequence');
const args = require('yargs').argv;

const options = { reporter: 'spec', grep: args.regex || '.' };

gulp.task('pre-test', () => {
    process.env.NODE_ENV = 'test';
    return gulp
        .src(['lib/**/*.js', 'models/*.js', 'routes/**/*.js'])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], () => {
    gulp
        .src('./tests/**/*-test.js', { read: false })
        .pipe(mocha(options))
        .pipe(istanbul.writeReports());
});

gulp.task('test-ci', sequence('test-unit', 'test-integration'));

gulp.task('test-db', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src('./tests/models/*-test.js', { read: false }).pipe(mocha(options));
});

gulp.task('test-unit', () => {
    process.env.NODE_ENV = 'test';
    return gulp
        .src('./tests/*-test.js', { read: false })
        .pipe(mocha(options))
        .once('error', (e) => {
            console.error(e);
            process.exit(1);
        })
        .once('end', () => {
            process.exit();
        });
});

gulp.task('watch-test-unit', () => {
    process.env.NODE_ENV = 'test';
    return gulp.watch('./tests/*-test.js', ['test-unit']);
});

gulp.task('test-integration', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src('./tests/integration/**/*-test.js', { read: false }).pipe(mocha(options));
});
