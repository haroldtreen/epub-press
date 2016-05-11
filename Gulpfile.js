const gulp = require('gulp');
const mocha = require('gulp-mocha');
const args = require('yargs').argv;

const options = { reporter: 'spec', harmony: true, grep: args.regex || '.' };

gulp.task('test', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src('./tests/**/*-test.js', { read: false })
			.pipe(mocha(options));
});

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
    return gulp.src('./tests/integration/*-test.js', { read: false })
            .pipe(mocha(options));
});
