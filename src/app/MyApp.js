'use strict';

var Utils = require('../3rd-party/utils');
require('../asset/loading-icon.gif');

var DEBUG = $$DEBUG$$;

/**
 * @param {Object} attributes
 * @constructor
 */
var MyApp = function(attributes) {
    // A list of attributes getable and setable.
    this.attributes_ = {
        'attr_string' : 'attr_string_default',
        'attr_number' : 256,
        'attr_bool' : false
    };

    this._updateAttributes(attributes);
};

/**
 * Html template
 * @type {string}
 * @static
 * @nocollapse
 */
MyApp.HTML_TEMPLATE = ''
    + '<div>'
    + '    <img src="loading-icon.gif" alt="loading icon"/>'
    + '</div>'
    + ''
    + '<div>'
    + '    <div>'
    + '        $$MESSAGE$$'
    + '    </div>'
    + '</div>'; // very important: @nocollapse is for keeping static property from closure compiler

/**
 * @param {string} message
 */
MyApp.prototype.run = function(message) {
    DEBUG && console.log('[MyApp] run...');

    var myAppElId = 'myapp-id';
    var myAppEl = document.getElementById(myAppElId);
    if (!myAppEl) {
        DEBUG && console.log('[MyApp] run... not found myApp element with id #' + myAppElId);
        return;
    }

    DEBUG && console.log('[MyApp] run... building content...');
    var msg = '';
    msg += 'Your message: ' + message;
    msg += '<br>';
    msg += 'current attributes: ' + this.attributes_['attr_string'] + ' - ' + this.attributes_['attr_number'] + ' - ' + this.attributes_['attr_bool'];

    var contents = MyApp.HTML_TEMPLATE;
    contents = contents.replace('$$MESSAGE$$', msg);

    myAppEl.innerHTML = contents;

    DEBUG && console.log('[MyApp] run... finished');
};

/**
 * update Attributes
 *
 * @param {Object} attributes
 * @private
 */
MyApp.prototype._updateAttributes = function (attributes) {
    if (!Utils.isObject(attributes)) {
        return;
    }

    // only allow these Attributes elements to be overwritten
    var allowedAttributes = {
        'attr_string' : attributes['attr_string'],
        'attr_number' : attributes['attr_number'],
        'attr_bool' : attributes['attr_bool']
    };

    // remove any undefined elements
    var newElements = {};

    for (var mrElement in allowedAttributes) {
        if (!allowedAttributes.hasOwnProperty(mrElement)) {
            continue;
        }

        if (Utils.isUndefined(allowedAttributes[mrElement])) {
            continue;
        }

        newElements[mrElement] = allowedAttributes[mrElement];
    }

    DEBUG && console.log('[MyApp] setting new Attributes', newElements);

    this._attributes = Utils.extend(this._attributes, newElements);
};

module['exports'] = MyApp;