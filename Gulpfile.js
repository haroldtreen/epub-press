require('harmonize')();

const gulp = require('gulp');
const mocha = require('gulp-mocha');

gulp.task('default', () => {
    return gulp.src('./tests/*-test.js', { read: false })
        // gulp-mocha needs filepaths so you can't have any plugins before it
        .pipe(mocha({ reporter: 'spec', harmony: true }));
});

gulp.task('test-db', () => {
	process.env.NODE_ENV = 'test';
    return gulp.src('./tests/models/*-test.js', { read: false })
			.pipe(mocha({ reporter: 'spec', harmony: true }));
});
