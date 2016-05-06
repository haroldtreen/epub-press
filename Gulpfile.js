const gulp = require('gulp');
const mocha = require('gulp-mocha');

gulp.task('test', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src('./tests/**/*-test.js', { read: false })
			.pipe(mocha({ reporter: 'spec', harmony: true }));
});

gulp.task('test-db', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src('./tests/models/*-test.js', { read: false })
			.pipe(mocha({ reporter: 'spec', harmony: true }));
});

gulp.task('test-unit', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src('./tests/*-test.js', { read: false })
            .pipe(mocha({ reporter: 'spec', harmony: true }));
});

gulp.task('test-integration', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src('./tests/integration/*-test.js', { read: false })
            .pipe(mocha({ reporter: 'spec', harmony: true }));
});
