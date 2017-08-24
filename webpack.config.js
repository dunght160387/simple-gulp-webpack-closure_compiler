var webpack = require("webpack");
var fs = require("fs");
var path = require('path');
var ClosureCompilerPlugin = require('webpack-closure-compiler');
var argv = require('yargs').argv;

// get 'env' argument, 'env=prod' for production, 'env=dev' for development
var __ENV = argv.env ? argv.env : 'prod'; // default is build production
var __DISABLE_DEBUG = argv['disable-debug'] ? true : false;
var __IS_DEV = ('dev' === __ENV);
var __IS_TEST = ('test' === __ENV);
var DEBUG = __IS_DEV || (__IS_TEST && !__DISABLE_DEBUG);

var __VERSION = argv.version || false; // default is build production
var myAppVersion = __VERSION;

console.log('webpack build ' + __ENV + ' with version = ' + __VERSION + ', debug = ' + DEBUG);

module.exports = {
    entry: getWebpackEntry(),
    output: {
        path: './dist/3.deploy/' + __ENV,
        filename: '[name].js'
    },
    devtool: 'source-map',
    resolve: {
        modulesDirectories: ["node_modules", "bower_components", "web_components"]
    },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                include: [
                    path.resolve(__dirname, 'dist'),
                    path.resolve(__dirname, 'dev')
                ],
                loader: 'babel',
                query: {
                    presets: ['es2015']
                }
            },
            {
                test: /\.(swf|html)$/,
                loader: "file?name=[name].[ext]"
            },
            {
                test: /\.(png|jpg|jpeg|gif|woff)$/,
                loader: 'file?name=[name].[ext]'
            },
            {
                test: /\.js$/,
                loader: 'webpack-replace',
                query: {
                    replace: [
                        {
                            from: '$$MY-PATTERN$$',
                            to: __IS_DEV ? 'my-value-for-dev' : 'my-value-for-prod'
                        }
                    ]
                }
            }
        ]
    },
    devServer: {
        contentBase: './dist'
    },
    plugins: [
        new ClosureCompilerPlugin(getClosureCompilerConfig()),
        new webpack.DefinePlugin({
            // Note: using `<var>: JSON.stringify(<define value>)` if need define object, string
            DEBUG: DEBUG
        })
    ]
};

/**
 * get Webpack Entry
 * Use this function to dynamic modify entry filename to get expected output file name.
 * Here is for out vpaic client output file name with version that is configured from package.json
 * @return {{}}
 */
function getWebpackEntry() {
    DEBUG && console.log('get webpack entry...');
    var entry = {};

    var outputMyApp = 'my-app-' + myAppVersion;
    entry[outputMyApp] = ['babel-polyfill', './dist/2.compiled/app.js']; // using babel-polyfill to allow some browsers support such as 'Promise, Symbol, ...'

    /* for local test */
    entry['play'] = './dev/play.js';

    DEBUG && console.log('get webpack entry... done. Entry: ' + JSON.stringify(entry));
    return entry;
}

/**
 * get Closure Compiler config
 *
 * @return {{compiler: {language_in: string, language_out: string, compilation_level: string, externs: *}, concurrency: number}}
 */
function getClosureCompilerConfig() {
    var closureCompilerConfig = {
        compiler: {
            language_in: 'ECMASCRIPT6',
            language_out: 'ECMASCRIPT5',
            compilation_level: __IS_DEV ? 'SIMPLE' : 'SIMPLE', // WHITESPACE_ONLY, SIMPLE, ADVANCED, ADVANCED_OPTIMIZATIONS. Now WHITESPACE_ONLY is error. TODO: find other way to use WHITESPACE_ONLY for dev.
            externs: getExternFiles() //js_externs, externs_url are not working
        },
        concurrency: 3
    };

    DEBUG && console.log('closure compiler config: ' + "\n" + JSON.stringify(closureCompilerConfig, null, 4));

    return closureCompilerConfig;
}

/**
 * get Extern Files, depend on 3rd library files that we need keep exported field/functions of them
 * @return {Array.<T>}
 */
function getExternFiles() {
    DEBUG && console.log("getting extern files...");

    return [].concat(
        getFilesInDirectory('src/externs/')
    );
}

/**
 * get all files in a dir
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
