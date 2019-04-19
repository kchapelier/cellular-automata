"use strict";

const ndarray = require('ndarray');

const utils = {};

utils.createArray = function (shape, defaultValue) {
  const length = shape.reduce(function (p, v) { return p * v; }, 1);
  const dataArray = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
      dataArray[i] = defaultValue;
  }

  return ndarray(dataArray, shape);
};

module.exports = utils;