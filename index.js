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

CellularAutomata.prototype.calculateNeighbours = function () {
    this.neighbourhood = distanceFunctions[this.neighbourhoodType](this.neighbourhoodRange, this.shape.length);
};

CellularAutomata.prototype.setOutOfBoundValue = function (outOfBoundValue) {
    this.outOfBoundValue = outOfBoundValue;
};

CellularAutomata.prototype.setRule = function (rule, neighbourhoodType, neighbourhoodRange) {
    var ruleType = typeof rule;

    if (ruleType === 'string') {
        this.rule = parser(rule);

        if (this.rule === null) {
            throw new Error('The rulestring could not be parsed.');
        }

        this.neighbourhoodType = this.rule.neighbourhoodType;
        this.neighbourhoodRange = this.rule.neighbourhoodRange;
    } else if(ruleType === 'function') {
        this.rule = {
            ruleType: 'custom',
            process: rule
        };

        this.neighbourhoodType = neighbourhoodType === 'von-neumann' ? 'von-neumann' : 'moore';
        this.neighbourhoodRange = neighbourhoodRange || 1;
    } else {
        throw new Error('Invalid rule, neither a string nor a function.');
    }

    this.calculateNeighbours();
};

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
        internalArrayIndex = 0;

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

CellularAutomata.prototype.switchArrays = function () {
    var temp = this.currentArray;
    this.currentArray = this.workingArray;
    this.workingArray = temp;
};

CellularAutomata.prototype.singleIteration = function () {
    this.iterate(1);
};

CellularAutomata.prototype.iterate = function (iterationNumber) {
    var x, y, i;

    for (i = 0; i < iterationNumber; i++) {
        //TODO do not hardcode it as 2D

        for (x = 0; x < this.shape[0]; x++) {
            for (y = 0; y < this.shape[1]; y++) {
                this.workingArray.set(x, y, this.rule.process(this.get(x, y), this.getNeighbours(x, y)));
            }
        }

        this.switchArrays();
    }
};

module.exports = CellularAutomata;

