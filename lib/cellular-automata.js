"use strict";

const parser = require('cellular-automata-rule-parser');
const neighbourhoodFunctions = require('./utils/neighbourhood-functions');
const utils = require('./utils/utils');

/**
 * CellularAutomata constructor
 * @param {int[]} shape Shape of the grid
 * @param {int} [defaultValue=0] Default value of the cells
 * @constructor
 */
function CellularAutomata (shape, defaultValue) {
  this.shape = shape;
  this.dimension = shape.length;

  defaultValue = defaultValue || 0;

  this.array = utils.createArray(shape, defaultValue);
  this.workingArray = utils.createArray(shape, defaultValue);

  this.stride = this.array.stride;
  this.setRng();
}

CellularAutomata.prototype.shape = null;
CellularAutomata.prototype.stride = null;
CellularAutomata.prototype.dimension = null;

CellularAutomata.prototype.array = null;
CellularAutomata.prototype.workingArray = null;

CellularAutomata.prototype.rule = null;
CellularAutomata.prototype.rng = null;

CellularAutomata.prototype.neighbourhoodType = null;
CellularAutomata.prototype.neighbourhoodRange = null;
CellularAutomata.prototype.neighbourhood = null;
CellularAutomata.prototype.neighbourhoodNumber = null;
CellularAutomata.prototype.neighbourhoodValues = null;

CellularAutomata.prototype.outOfBoundValue = null;
CellularAutomata.prototype.outOfBoundWrapping = false;
CellularAutomata.prototype.outOfBoundClamping = false;

/**
 * Set the random number generation function used internally
 * @param {function} [rng=Math.random] Random number generation function, default to Math.random()
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.setRng = function (rng) {
  this.rng = rng || Math.random;

  return this;
};

/**
 * Fill the grid with a given distribution
 * @param {Array[]} distribution The distribution to fill the grid with (ie: [[0,90], [1,10]] for 90% of 0 and 10% of 1). Null values are ignored.
 * @param {function} [rng=null] Random number generation function, default to the internal RNG settable with setRng().
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.fillWithDistribution = function (distribution, rng) {
  const array = this.array.data;
  const numberOfDistributions = distribution.length;
  let sum = 0;

  rng = rng || this.rng;

  for (let i = 0; i < numberOfDistributions; i++) {
    sum += distribution[i][1];
  }

  for (let k = 0; k < array.length; k++) {
    let selection = rng() * sum;

    for (let i = 0; i < numberOfDistributions; i++) {
      selection -= distribution[i][1];
      if (selection <= 0 && distribution[i][0] !== null) {
        array[k] = distribution[i][0];
        break;
      }
    }
  }

  return this;
};

/**
 * Sort the neighbourhood from left to right, top to bottom, ...
 * @param {Array} a First neighbour
 * @param {Array} b Second neighbour
 * @returns {number}
 */
function neighbourhoodSorter (a, b) {
  a = a.join(',');
  b = b.join(',');
  return a > b ? 1 : a < b ? -1 : 0;
}

/**
 * Define the neighbourhood type (moore, von-neumann, axis, corner, edge or face) and range, pre-calculate the relative positions of the neighbours
 * @param {string} [neighbourhoodType=null] moore, von-neumann, axis, corner, edge or face
 * @param {int} [neighbourhoodRange=1]
 * @protected
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.setNeighbourhood = function (neighbourhoodType, neighbourhoodRange) {
  this.neighbourhoodType = !!neighbourhoodFunctions[neighbourhoodType] ? neighbourhoodType : 'moore';
  this.neighbourhoodRange = neighbourhoodRange || 1;

  this.neighbourhood = neighbourhoodFunctions[this.neighbourhoodType](this.neighbourhoodRange, this.dimension);
  this.neighbourhood.sort(neighbourhoodSorter);
  this.neighbourhoodNumber = this.neighbourhood.length;
  this.neighbourhoodValues = new Uint8Array(this.neighbourhoodNumber);

  return this;
};

/**
 * Define the value used for the cells out of the array's bounds
 * @param {int|string} [outOfBoundValue=0] Any integer value, the string "wrap" to enable out of bound wrapping or the string "clamp" to enable bound clamping.
 * @public
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.setOutOfBoundValue = function (outOfBoundValue) {
  if (outOfBoundValue === 'clamp') {
    this.outOfBoundClamping = true;
    this.outOfBoundWrapping = false;
    this.outOfBoundValue = 0;
  } else if (outOfBoundValue === 'wrap') {
    this.outOfBoundClamping = false;
    this.outOfBoundWrapping = true;
    this.outOfBoundValue = 0;
  } else {
    this.outOfBoundClamping = false;
    this.outOfBoundWrapping = false;
    this.outOfBoundValue = outOfBoundValue | 0;
  }

  return this;
};

/**
 * Define the rule of the cellular automata and the neighbourhood to be used.
 * @param {string|function} rule Either a rule string in the S/B, S/B/C or R/T/C/N format or a function accepting the current value as the first argument and the neighbours as the second argument.
 * @param {string} [neighbourhoodType="moore"] Neighbourhood type (moore, von-neumann, axis, corner, edge or face), only used when the rule is a function.
 * @param {int} [neighbourhoodRange=1] Neighbourhood range, only used when the rule is a function.
 * @public
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.setRule = function (rule, neighbourhoodType, neighbourhoodRange) {
  const ruleType = typeof rule;

  if (ruleType === 'string') {
    this.rule = parser(rule);

    if (this.rule === null) {
      throw new Error('The rulestring could not be parsed.');
    }

    this.setNeighbourhood(this.rule.neighbourhoodType, this.rule.neighbourhoodRange);
  } else if(ruleType === 'function') {
    this.rule = {
      ruleType: 'custom',
      process: rule
    };

    this.setNeighbourhood(neighbourhoodType, neighbourhoodRange);
  } else {
    throw new Error('Invalid rule, neither a string nor a function.');
  }

  return this;
};

/**
 * Obtain all the neighbours for a given cell, the current neighbourhood type and range
 * @param {...number} cell - The coordinates of the cell
 * @protected
 * @returns {Array}
 */
CellularAutomata.prototype.getNeighbours = function (cell) {
  const stride = this.stride;
  const neighbourValues = this.neighbourhoodValues;
  const dimensionNumber = this.dimension;

  for (let neighbourIndex = 0; neighbourIndex < this.neighbourhoodNumber; neighbourIndex++) {
    let isOutOfBound = false;
    let internalArrayIndex = 0;

    for (let dimension = 0; dimension < dimensionNumber && !isOutOfBound; dimension++) {
      let currentArgumentValue = arguments[dimension] + this.neighbourhood[neighbourIndex][dimension];

      if (currentArgumentValue < 0 || currentArgumentValue >= this.shape[dimension]) {
        if (this.outOfBoundClamping) {
          // clamp to the bound
          currentArgumentValue = Math.max(0, Math.min(currentArgumentValue, this.shape[dimension] - 1));
        } else if (this.outOfBoundWrapping) {
          // euclidean modulo
          currentArgumentValue = (currentArgumentValue + Math.abs(this.shape[dimension])) % this.shape[dimension];
        } else {
          isOutOfBound = true;
        }
      }

      internalArrayIndex += currentArgumentValue * stride[dimension];
    }

    neighbourValues[neighbourIndex] = isOutOfBound ? this.outOfBoundValue : this.array.data[internalArrayIndex];
  }

  return neighbourValues;
};

/**
 * Apply the previously defined CA rule multiple times.
 * @param {int} [iterationNumber=1] Number of iterations
 * @public
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.iterate = function (iterationNumber) {
  const arrayLength = this.array.data.length;
  const dimensionNumber = this.dimension;
  const stride = this.stride;
  const shape = this.shape;
  const neighboursArguments = new Array(dimensionNumber);

  iterationNumber = iterationNumber || 1;

  for (let currentIteration = 0; currentIteration < iterationNumber; currentIteration++) {
    for (let index = 0; index < arrayLength; index++) {
      for (let currentDimension = 0; currentDimension < dimensionNumber; currentDimension++) {
        neighboursArguments[currentDimension] = ((index / stride[currentDimension]) | 0) % shape[currentDimension];
      }

      this.workingArray.data[index] = this.rule.process(
        this.array.data[index],
        this.getNeighbours.apply(this, neighboursArguments),
        this.rng
      );
    }

    // switch the current and the working array
    const temp = this.array;
    this.array = this.workingArray;
    this.workingArray = temp;
  }

  return this;
};

/**
 * Apply a given rule for a given number of iterations, shortcut method for setRule and iterate
 * @param {string|function} rule Either a rule string in a format supported by the rule parser or a function accepting the current value as the first argument and the neighbours as the second argument.
 * @param {int} [iteration=1] Number of iterations
 * @param {string} [neighbourhoodType="moore"] Neighbourhood type (moore, von-neumann, axis, corner, edge or face), only used when the rule is a function.
 * @param {int} [neighbourhoodRange=1] Neighbourhood range, only used when the rule is a function.
 * @public
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.apply = function (rule, iteration, neighbourhoodType, neighbourhoodRange) {
  return this.setRule(rule, neighbourhoodType, neighbourhoodRange).iterate(iteration);
};

module.exports = CellularAutomata;