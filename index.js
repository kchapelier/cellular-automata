"use strict";

var moore = require('moore'),
    vonNeumann = require('von-neumann'),
    parser = require('cellular-automata-rule-parser'),
    utils = require('./utils/utils');

var distanceFunctions = {
    'moore': moore,
    'von-neumann': vonNeumann
};

//TODO test single typed array for all getNeighbours calls for perfs

var CellularAutomata = function (shape, defaultValue) {
    this.shape = shape;
    this.defaultValue = defaultValue || 0;

    this.currentArray = utils.createArray(this.shape, this.defaultValue);
    this.workingArray = utils.createArray(this.shape, this.defaultValue);
};

CellularAutomata.prototype.shape = null;
CellularAutomata.prototype.defaultValue = null;
CellularAutomata.prototype.outOfBoundValue = null;
CellularAutomata.prototype.outOfBoundWrapping = false;

CellularAutomata.prototype.currentArray = null;
CellularAutomata.prototype.workingArray = null;

CellularAutomata.prototype.rule = null;
CellularAutomata.prototype.neighbourhoodType = null;
CellularAutomata.prototype.neighbourhoodRange = null;
CellularAutomata.prototype.neighbourhood = null;

/**
 * Fill the grid with a given distribution
 * @param {Array[]} distributions The distribution to fill the grid with (ie: [[0,90], [1,10]] for 90% of 0 and 10% of 1)
 * @param {function} [rng=Math.random] A random number generation function, default to Math.random()
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.fillWithDistribution = function (distributions, rng) {
    var sum = 0,
        array = this.currentArray.data,
        numberOfDistributions = distributions.length,
        selection,
        i, k;

    rng = rng || Math.random;

    for (i = 0; i < numberOfDistributions; i++) {
        sum += distributions[i][1];
    }

    for (k = 0; k < array.length; k++) {
        selection = rng() * sum;

        for (i = 0; i < numberOfDistributions; i++) {
            selection -= distributions[i][1];
            if (selection <= 0) {
                array[k] = distributions[i][0];
                break;
            }
        }
    }

    return this;
};

/**
 * Replace values in the grid
 * @param {Object} replacements Object with search value as key and replacement as value
 * @protected
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.replace = function (replacements) {
    var i = 0,
        array = this.currentArray.data,
        value;

    for (; i < array.length; i++) {
        value = array[i];

        if (value in replacements) {
            value = replacements[value];
        }

        array[i] = value;
    }

    return this;
};

/**
 * Define the neighbourhood type (moore or von-neumann) and range, pre-calculate the relative positions of the neighbours
 * @param {string} [neighbourhoodType=null] moore or von-neumann
 * @param {int} [neighbourhoodRange=1]
 * @protected
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.setNeighbourhood = function (neighbourhoodType, neighbourhoodRange) {
    this.neighbourhoodType = !!distanceFunctions[neighbourhoodType] ? neighbourhoodType : 'moore';
    this.neighbourhoodRange = neighbourhoodRange || 1;

    this.neighbourhood = distanceFunctions[this.neighbourhoodType](this.neighbourhoodRange, this.shape.length);

    return this;
};

/**
 * Define the value used for the cells out of the array's bounds
 * @param {int|string} outOfBoundValue Any integer value or the string "wrap" to enable out of bound wrapping.
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
 * Set the rule for the cellular automata
 * @param {string|function} rule Either a rule string in the S/B, S/B/C or R/T/C/N format or a function accepting the current value as the first argument and the neighbours as the second argument.
 * @param {string} [neighbourhoodType="moore"] Neighbourhood type (moore or von-neumann), only used when the rule is a function.
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
 * @protected
 * @returns {Array}
 */
CellularAutomata.prototype.getNeighbours = function () {
    var stride = this.currentArray.stride,
        neighbourValues = new Array(this.neighbourhood.length),
        dimensionNumber = this.currentArray.dimension,
        currentArgumentValue,
        isOutOfBound,
        internalArrayIndex,
        neighbourIndex, dimension;

    for (neighbourIndex = 0; neighbourIndex < this.neighbourhood.length; neighbourIndex++) {
        isOutOfBound = false;
        internalArrayIndex = this.currentArray.offset;

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

        neighbourValues[neighbourIndex] = isOutOfBound ? this.outOfBoundValue : this.currentArray.data[internalArrayIndex];
    }

    return neighbourValues;
};

/**
 * Switch the current and the working array
 * @protected
 */
CellularAutomata.prototype.switchArrays = function () {
    var temp = this.currentArray;
    this.currentArray = this.workingArray;
    this.workingArray = temp;
};

/**
 * Make multiple iterations
 * @param {int} [iterationNumber=1] Number of iterations
 * @public
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.iterate = function (iterationNumber) {
    var arrayLength = this.currentArray.data.length,
        dimensionNumber = this.shape.length,
        stride = this.currentArray.stride,
        shape = this.currentArray.shape,
        neighboursArguments = new Array(dimensionNumber),
        index, currentIteration, currentDimension;

    iterationNumber = iterationNumber || 1;

    for (currentIteration = 0; currentIteration < iterationNumber; currentIteration++) {

        for (index = 0; index < arrayLength; index++) {
            for (currentDimension = 0; currentDimension < dimensionNumber; currentDimension++) {
                neighboursArguments[currentDimension] = ((index / stride[currentDimension]) | 0) % shape[currentDimension];
            }

            this.workingArray.data[index] = this.rule.process(this.currentArray.data[index], this.getNeighbours.apply(this, neighboursArguments));
        }

        this.switchArrays();
    }

    return this;
};

/**
 * Apply a given rule for a given number of iterations, shortcut method for setRule and iterate
 * @param {string|function} rule Either a rule string in a format supported by the rule parser or a function accepting the current value as the first argument and the neighbours as the second argument.
 * @param {int} [iteration=1] Number of iterations
 * @param {string} [neighbourhoodType="moore"] Neighbourhood type (moore or von-neumann), only used when the rule is a function.
 * @param {int} [neighbourhoodRange=1] Neighbourhood range, only used when the rule is a function.
 * @public
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.apply = function (rule, iteration, neighbourhoodType, neighbourhoodRange) {
    return this.setRule(rule, neighbourhoodType, neighbourhoodRange).iterate(iteration);
};

module.exports = CellularAutomata;

