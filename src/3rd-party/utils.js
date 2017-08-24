'use strict';

function isNull(o) {
    return o === null;
}

function isUndefined(o) {
    return o === undefined;
}

function isObject(obj) {
    return typeof obj === 'object';
}

function isFunction(str) {
    return typeof str === 'function';
}

function isNumber(num) {
    return typeof num === 'number';
}

function isArray(array) {
    return Object.prototype.toString.call(array) === '[object Array]';
}

function isString(str) {
    return typeof str === 'string';
}

function extend(obj) {
    var arg, i, k;
    for (i = 1; i < arguments.length; i++) {
        arg = arguments[i];
        for (k in arg) {
            if (arg.hasOwnProperty(k)) {
                if (isObject(obj[k]) && !isNull(obj[k]) && isObject(arg[k])) {
                    obj[k] = extend({}, obj[k], arg[k]);
                } else {
                    obj[k] = arg[k];
                }
            }
        }
    }
    return obj;
}

function myUppercase(str) {
    return str ? str.uppercase() : str;
}

var Utils = {
    'isNull': isNull,
    'isUndefined': isUndefined,
    'isObject': isObject,
    'isFunction': isFunction,
    'isNumber': isNumber,
    'isArray': isArray,
    'isString': isString,
    'extend': extend,
    'myUppercase': myUppercase
};

module.exports = Utils;