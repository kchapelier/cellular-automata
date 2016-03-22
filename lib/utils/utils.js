"use strict";

var ndarray = require('ndarray');

var utils = {};

utils.createArray = function (shape, defaultValue) {
    var length = shape.reduce(function (p, v) { return p * v; }, 1),
        dataArray = new Uint8Array(length),
        i;

    for (i = 0; i < length; i++) {
        dataArray[i] = defaultValue;
    }

    return ndarray(dataArray, shape);
};

module.exports = utils;
