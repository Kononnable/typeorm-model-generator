const gulp = require('gulp')
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const clean = require("gulp-clean");
const shell = require('gulp-shell');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');
const remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');

gulp.task('compile', ['clean'], function () {
    var tsProject = ts.createProject('tsconfig.json');
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'))
});

gulp.task('clean', function () {
    return gulp.src(['dist', 'coverage', 'output'], { read: false })
        .pipe(clean());
});

gulp.task('prettier', function () {
    return gulp.src('.prettierrc')
        .pipe(shell(['prettier ./src/**/*.ts --write']))
});

gulp.task('pre-commit', ['prettier'], function () {
    return gulp.src('package.json', { read: false })
        .pipe(shell(['git update-index --again']))
})

gulp.task('watch', function () {
    gulp.src('tsconfig.json')
        .pipe(shell(['tsc -w']))

    var watcher = gulp.watch(['src/**/*.ts', 'test/**/*.ts']);

    watcher.on('change', function (changeInfo) {
        console.log('File ' + changeInfo.path + ' was ' + changeInfo.type + '.');
        if (changeInfo.type == 'deleted') {
            let jsFilePath = changeInfo.path
                .split('.ts').join('.js')
                .split('\\').join('/')
                .split('/src/').join('/dist/src/')
                .split('/test/').join('/dist/test/');
            return gulp.src([jsFilePath, jsFilePath + '.map'], { read: false })
                .pipe(clean());
        }
    });
})

gulp.task('pre-test', function () {
    return gulp.src(['dist/src/**/*.js'])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
    return gulp.src(['dist/test/**/*.test.js'], { read: false })
        .pipe(mocha())
});

gulp.task('coveragePost', ['test'], function () {
    return gulp.src(['dist/test/**/*.test.js'], { read: false })
        .pipe(istanbul.writeReports())
});

gulp.task('coverageRemap', ['coveragePost'], function () {
    var GulpStream = gulp.src('coverage/coverage-final.json')
        .pipe(remapIstanbul())
        .pipe(gulp.dest('coverage/remapped'));
    if ((process.env.CI == 'true')) {
        GulpStream = GulpStream.pipe(shell(['codecov --file=./coverage/remapped/coverage-final.json ']));
    }
    return GulpStream;
})
