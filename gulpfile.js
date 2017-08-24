'use strict';

/* all required gulp libs */
var gulp = require('gulp');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var flatmap = require('gulp-flatmap');
var fs = require('fs');
var path = require('path');
var argv = require('yargs').argv;
var closureCompiler = require('google-closure-compiler').gulp();
var replace = require('gulp-replace');

var exec = require('child_process').exec;
var through2 = require('through2');
var chalk = require('chalk');


/* build config */
// get 'env' argument, 'env=prod' for production, 'env=dev' for development
var __ENV = argv.env ? argv.env : 'prod'; // default is build production
var __DISABLE_DEBUG = argv['disable-debug'] ? true : false;
var __IS_DEV = ('dev' === __ENV);
var __IS_TEST = ('test' === __ENV);
var DEBUG = __IS_DEV || (__IS_TEST && !__DISABLE_DEBUG);

gutil.log('gulp runs with env=' + __ENV + (__IS_TEST ? (' (--disable-debug=' + __DISABLE_DEBUG + ')') : '') + ', DEBUG=' + DEBUG + '\n');

var DIST = 'dist'; // DO NOT add "./" base
var DIST_RAW = DIST + '/1.raw';
var DIST_COMPILED = DIST + '/2.compiled';
var DIST_DEPLOY = DIST + '/3.deploy/' + __ENV;

var outputMyAppVersion = false;

/* === all tasks === */
//
// clean: clean all in dist
// input: src
// output: DIST_RAW
//
gulp.task('clean', function () {
    return gulp.src(DIST, {read: false})
        .pipe(clean());
});

//
// js replace: replace const
// input: src
// output: DIST_RAW
//
gulp.task('js-replace', ['clean'], function () {
    return gulp.src(
        [
            './src/app/MyApp.js'
        ], {base: 'src'})
        .pipe(replace('$$DEBUG$$', DEBUG))
        .pipe(gulp.dest(DIST_RAW));
});

//
// copy no-need-compiled files to compiled
// input: src
// output: DIST_COMPILED
//
gulp.task('copy-no-need-compiled-files-to-compiled', ['clean'], function () {
    return gulp.src(
        [
            './src/3rd-party/**/*.js',
            './src/asset/**/*.*',
            './src/app.js'
        ], {base: 'src'})
        .pipe(gulp.dest(DIST_COMPILED));
});

//
// advanced compile separately modules
// input: DIST_RAW
// output: DIST_COMPILED
//
gulp.task('js-compile-advanced', ['js-replace'], function () {
    if (__IS_DEV) {
        return gulp.src(
            [
                DIST_RAW + '/app/MyApp.js'
            ], {base: DIST_RAW})
            .pipe(gulp.dest(DIST_COMPILED));
    }

    var externFiles = getExternFiles();

    return gulp.src(
        [
            DIST_RAW + '/app/MyApp.js'
        ], {base: './'})
        .pipe(flatmap(function (stream, file) {
            return stream.pipe(closureCompiler({
                compilation_level: 'ADVANCED',
                //manage_closure_dependencies: true,
                //warning_level: 'QUIET',
                language_in: 'ECMASCRIPT6_STRICT',
                language_out: 'ECMASCRIPT5_STRICT',
                output_wrapper: '(function(){\n%output%\n}).call(this)',
                js_output_file: path.join(path.dirname(file.path).replace(DIST_RAW, ''), path.basename(file.path)),
                externs: externFiles
            }))
        }))
        .pipe(gulp.dest(DIST_COMPILED));
});

//
// outputMyAppVersion task: get current app version base on git branch/tag name
// e.g: git branch "dev.feature-1" => my-app-dev.feature-1.js
// e.g: git tag "1.0.0" => my-app-1.0.0.js
//
gulp.task('getOutputMyAppVersion', function () {
    return gulp.src(['./'])
        .pipe(through2.obj(function (chunk, enc, callback) {
            // run command 'git symbolic-ref -q --short HEAD || git describe --tags --exact-match'
            exec('git symbolic-ref -q --short HEAD || git describe --tags --exact-match', function (err, stdout, stderr) {
                if (err || !stdout || stdout.length < 1) {
                    gutil.log('error can not get current branch or tag name');
                    outputMyAppVersion = false; // false to tell gulp task 'compile:flash' stop compiling
                    callback();
                    return;
                }

                var isTag = stdout.lastIndexOf('v') == 0;
                outputMyAppVersion = isTag ? stdout.substr(1) : stdout;

                // remove return carriage characters
                outputMyAppVersion = outputMyAppVersion.replace(/(\r\n|\n|\r)/g, '');

                gutil.log('got current ' + (isTag ? 'tag: v' : 'branch: ') + outputMyAppVersion);

                callback();
            });
        }))
        .pipe(gulp.dest('./'));
});

//
// js compile
//
gulp.task('js-compile', ['copy-no-need-compiled-files-to-compiled', 'js-compile-advanced'], function () {
});

//
// js compile + got myAppVersion
//
gulp.task('js-compile-and-got-my-app-version', ['js-compile', 'getOutputMyAppVersion'], function () {
});

//
// webpack task: call webpack to build
//
gulp.task('webpack', ['js-compile-and-got-my-app-version'], function () {
    gutil.log('webpack start...');

    if (!outputMyAppVersion) {
        gutil.log(chalk.red('webpack start... git branch/tag version invalid. End'));
        return;
    }

    return gulp.src(['./'])
        .pipe(through2.obj(function (chunk, enc, callback) {
            // run command 'webpack'
            exec('webpack ' + ('--env=' + __ENV + ' ') + (__DISABLE_DEBUG ? '--disable-debug ' : ' ') + '--version=' + outputMyAppVersion, function (err, stdout, stderr) {
                gutil.log('webpack output: \n' + stdout);

                if (err) {
                    gutil.log('error: ' + err);
                    outputMyAppVersion = false; // false to tell gulp task 'compile:flash' stop compiling

                    callback();
                    return;
                }

                callback();
            });
        }))
        .pipe(gulp.dest('./'));
});

//
// js deploy: rename and copy to deploy folder
// input: DIST_COMPILED
// output: DIST_DEPLOY
//
gulp.task('js-deploy', ['webpack'], function () {
});

//
// js compile
//
gulp.task('build', ['js-deploy'], function () {
});

//
// default task
//
gulp.task('default', ['build']);

/**
 * get Extern Files, depend on 3rd library files that we need keep exported field/functions of them
 *
 * @return {Array.<T>}
 */
function getExternFiles() {
    DEBUG && console.log('getting extern files...');

    return [].concat(
        getFilesInDirectory('src/externs/3rd-party'),
        getFilesInDirectory('src/externs/app/')
    );
}

/**
 * get all files in a dir
 *
 * @param dir
 * @return {Array}
 */
function getFilesInDirectory(dir) {
    var allFileNames = fs.readdirSync(dir);
    var allFiles = [];

    allFileNames.map(function (file) {
        return path.join(dir, file);
    }).filter(function (file) {
        return fs.statSync(file).isFile();
    }).forEach(function (file) {
        DEBUG && console.log("    %s", file);
        allFiles.push(file);
    });

    return allFiles;
}