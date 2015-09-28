"use strict";

var moore = require('moore'),
    vonNeumann = require('von-neumann'),
    parser = require('cellular-automata-rule-parser'),
    utils = require('./utils/utils');

var distanceFunctions = {
    'moore': moore,
    'von-neumann': vonNeumann
};

//TODO implement wrapping
//TODO iterate is currently hardcoded as 2D, this should be fixed
//TODO set with distribution (with a provided rng)

var CellularAutomata = function (shape, defaultValue) {
    this.shape = shape;
    this.defaultValue = defaultValue || 0;

    this.currentArray = utils.createArray(this.shape, this.defaultValue);
    this.workingArray = utils.createArray(this.shape, this.defaultValue);
};

CellularAutomata.prototype.shape = null;
CellularAutomata.prototype.defaultValue = null;
CellularAutomata.prototype.outOfBoundValue = null;

CellularAutomata.prototype.currentArray = null;
CellularAutomata.prototype.workingArray = null;

CellularAutomata.prototype.rule = null;
CellularAutomata.prototype.neighbourhoodType = null;
CellularAutomata.prototype.neighbourhoodRange = null;
CellularAutomata.prototype.neighbourhood = null;

CellularAutomata.prototype.setWithDistribution = function (distributions, rng) {
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
 * @param {int} outOfBoundValue
 * @public
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.setOutOfBoundValue = function (outOfBoundValue) {
    this.outOfBoundValue = outOfBoundValue | 0;

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
 * @protected
 * @returns {*}
 */
CellularAutomata.prototype.get = function () {
    var stride = this.currentArray.stride,
        internalArrayIndex = 0,
        dimension = 0;

    for (; dimension < arguments.length; dimension++) {
        if (arguments[dimension] < 0 || arguments[dimension] >= this.shape[dimension]) {
            return this.outOfBoundValue;
        } else {
            internalArrayIndex += arguments[dimension] * stride[dimension];
        }
    }

    return this.currentArray.data[internalArrayIndex];
};

/**
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
                isOutOfBound = true;
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
 * @param {int} iterationNumber Number of iterations
 * @public
 * @returns {CellularAutomata} CellularAutomata instance for method chaining.
 */
CellularAutomata.prototype.iterate = function (iterationNumber) {
    var x, y, i;

    for (i = 0; i < iterationNumber; i++) {
        for (x = 0; x < this.shape[0]; x++) {
            for (y = 0; y < this.shape[1]; y++) {
                this.workingArray.set(x, y, this.rule.process(this.get(x, y), this.getNeighbours(x, y)));
            }
        }

        this.switchArrays();
    }

    return this;
};

module.exports = CellularAutomata;

