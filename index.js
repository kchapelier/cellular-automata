"use strict";

var parser = require('cellular-automata-rule-parser'),
    neighbourhoodFunctions = require('./utils/neighbourhood-functions'),
    utils = require('./utils/utils');

/**
 * CellularAutomata constructor
 * @param {int[]} shape Shape of the grid
 * @param {int} [defaultValue=0] Default value of the cells
 * @constructor
 */
var CellularAutomata = function (shape, defaultValue) {
    this.shape = shape;
    this.dimension = shape.length;

    defaultValue = defaultValue || 0;

    this.array = utils.createArray(shape, defaultValue);
    this.workingArray = utils.createArray(shape, defaultValue);

    this.stride = this.array.stride;
};

CellularAutomata.prototype.shape = null;
CellularAutomata.prototype.stride = null;
CellularAutomata.prototype.dimension = null;

CellularAutomata.prototype.array = null;
CellularAutomata.prototype.workingArray = null;

CellularAutomata.prototype.rule = null;

CellularAutomata.prototype.neighbourhoodType = null;
CellularAutomata.prototype.neighbourhoodRange = null;
CellularAutomata.prototype.neighbourhood = null;
CellularAutomata.prototype.neighbourhoodNumber = null;
CellularAutomata.prototype.neighbourhoodValues = null;

CellularAutomata.prototype.outOfBoundValue = null;
CellularAutomata.prototype.outOfBoundWrapping = false;

/**
 * Fill the grid with a given distribution
 * @param {Array[]} distribution The distribution to fill the grid with (ie: [[0,90], [1,10]] for 90% of 0 and 10% of 1). Null values are ignored.
 * @param {function} [rng=Math.random] A random number generation function, default to Math.random()
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.fillWithDistribution = function (distribution, rng) {
    var sum = 0,
        array = this.array.data,
        numberOfDistributions = distribution.length,
        selection,
        i,
        k;

    rng = rng || Math.random;

    for (i = 0; i < numberOfDistributions; i++) {
        sum += distribution[i][1];
    }

    for (k = 0; k < array.length; k++) {
        selection = rng() * sum;

        for (i = 0; i < numberOfDistributions; i++) {
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
var neighbourhoodSorter = function neighbourhoodSorter (a, b) {
    a = a.join(',');
    b = b.join(',');
    return a > b ? 1 : a < b ? -1 : 0;
};

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
 * @param {int|string} [outOfBoundValue=0] Any integer value or the string "wrap" to enable out of bound wrapping.
 * @public
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.setOutOfBoundValue = function (outOfBoundValue) {
    if (outOfBoundValue === 'wrap') {
        this.outOfBoundWrapping = true;
        this.outOfBoundValue = 0;
    } else {
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
    var ruleType = typeof rule;

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
    var stride = this.stride,
        neighbourValues = this.neighbourhoodValues,
        dimensionNumber = this.dimension,
        currentArgumentValue,
        isOutOfBound,
        internalArrayIndex,
        neighbourIndex, dimension;

    for (neighbourIndex = 0; neighbourIndex < this.neighbourhoodNumber; neighbourIndex++) {
        isOutOfBound = false;
        internalArrayIndex = 0;

        for (dimension = 0; dimension < dimensionNumber; dimension++) {
            currentArgumentValue = arguments[dimension] + this.neighbourhood[neighbourIndex][dimension];

            if (currentArgumentValue < 0 || currentArgumentValue >= this.shape[dimension]) {
                if (this.outOfBoundWrapping) {
                    // euclidean modulo
                    currentArgumentValue = currentArgumentValue % this.shape[dimension];
                    currentArgumentValue = currentArgumentValue < 0 ? currentArgumentValue + Math.abs(this.shape[dimension]) : currentArgumentValue;

                    internalArrayIndex += currentArgumentValue * stride[dimension];
                } else {
                    isOutOfBound = true;
                }
            } else {
                internalArrayIndex += currentArgumentValue * stride[dimension];
            }
        }

        neighbourValues[neighbourIndex] = isOutOfBound ? this.outOfBoundValue : this.array.data[internalArrayIndex];
    }

    return neighbourValues;
};

/**
 * Switch the current and the working array in a given cellular automata
 * @param {CellularAutomata} ca Instance of CellularAutomata
 */
var switchArrays = function switchArrays (ca) {
    var temp = ca.array;
    ca.array = ca.workingArray;
    ca.workingArray = temp;
};

/**
 * Apply the previously defined CA rule multiple times.
 * @param {int} [iterationNumber=1] Number of iterations
 * @public
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.iterate = function (iterationNumber) {
    var arrayLength = this.array.data.length,
        dimensionNumber = this.dimension,
        stride = this.stride,
        shape = this.shape,
        neighboursArguments = new Array(dimensionNumber),
        index, currentIteration, currentDimension;

    iterationNumber = iterationNumber || 1;

    for (currentIteration = 0; currentIteration < iterationNumber; currentIteration++) {

        for (index = 0; index < arrayLength; index++) {
            for (currentDimension = 0; currentDimension < dimensionNumber; currentDimension++) {
                neighboursArguments[currentDimension] = ((index / stride[currentDimension]) | 0) % shape[currentDimension];
            }

            this.workingArray.data[index] = this.rule.process(this.array.data[index], this.getNeighbours.apply(this, neighboursArguments));
        }

        switchArrays(this);
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
