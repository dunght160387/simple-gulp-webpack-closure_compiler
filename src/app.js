// loading point
var MyApp = require('./app/MyApp');

DEBUG && console.log('setting getMyApp()...');

window.getMyApp = function () {
    return new MyApp();
};

window['getMyApp'] = window.getMyApp;

DEBUG && console.log('setting getMyApp()... done.');