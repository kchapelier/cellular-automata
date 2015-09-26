"use strict";

var ndarray = require('ndarray'),
    moore = require('moore'),
    vonNeumann = require('von-neumann'),
    parser = require('cellular-automata-rule-parser');

var distanceFunctions = {
    'moore': moore,
    'von-neumann': vonNeumann
};

var createArray = function (shape, defaultValue) {
    var length = shape.reduce(function (p, v) { return p * v; }, 1),
        dataArray = new Int8Array(length),
        i;

    for (i = 0; i < length; i++) {
        dataArray[i] = defaultValue;
    }

    return ndarray(dataArray, shape);
};

//TODO implement wrapping

var CellularAutomata = function (shape, defaultValue) {
    this.shape = shape;
    this.defaultValue = defaultValue || 0;

    this.currentArray = createArray(this.shape, this.defaultValue);
    this.workingArray = createArray(this.shape, this.defaultValue);
};

CellularAutomata.prototype.shape = null;
CellularAutomata.prototype.defaultValue = null;
CellularAutomata.prototype.outOfBoundValue = null;

CellularAutomata.prototype.currentArray = null;
CellularAutomata.prototype.workingArray = null;

CellularAutomata.prototype.rule = null;
CellularAutomata.prototype.neighbourMethod = null;
CellularAutomata.prototype.neighbourRange = null;
CellularAutomata.prototype.neighbours = null;

CellularAutomata.prototype.calculateNeighbours = function () {
    this.neighbours = distanceFunctions[this.neighbourMethod](this.neighbourRange, this.shape.length);
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

        this.neighbourMethod = this.rule.neighbourhoodType;
        this.neighbourRange = this.rule.neighbourhoodRange;
    } else if(ruleType === 'function') {
        this.rule = {
            ruleType: 'custom',
            process: rule
        };

        this.neighbourMethod = neighbourhoodType === 'von-neumann' ? 'von-neumann' : 'moore';
        this.neighbourRange = neighbourhoodRange || 1;
    } else {
        throw new Error('Invalid rule, neither a string nor a function.');
    }

    this.calculateNeighbours();
};

CellularAutomata.prototype.get = function () {
    var i = 0,
        value;

    for (; i < arguments.length; i++) {
        if (arguments[i] < 0 || arguments[i] >= this.shape[i]) {
            return this.outOfBoundValue;
        }
    }

    return this.currentArray.get.apply(this.currentArray, arguments);
};

CellularAutomata.prototype.getNeighbours = function () {
    var self = this,
        neighbourArguments = arguments,
        getArguments = new Array(arguments.length);

    //TODO bypassing get may increase the performance, due to the arguments thing going on

    return this.neighbours.map(function (relativeNeighbor) {
        for (var i = 0; i < neighbourArguments.length; i++) {
            getArguments[i] = neighbourArguments[i] + relativeNeighbor[i];
        }

        return self.get.apply(self, getArguments);
    });
};

CellularAutomata.prototype.switchArrays = function () {
    var temp = this.currentArray;
    this.currentArray = this.workingArray;
    this.workingArray = temp;
};

CellularAutomata.prototype.singleIteration = function () {
    //TODO do not hardcode it as 2D

    for (var x = 0; x < this.shape[0]; x++) {
        for (var y = 0; y < this.shape[1]; y++) {
            this.workingArray.set(x, y, this.rule.process(this.get(x, y), this.getNeighbours(x, y)));
        }
    }

    this.switchArrays();
};

CellularAutomata.prototype.iterate = function (iterationNumber) {
    for (var i = 0; i < iterationNumber; i++) {
        this.singleIteration();
    }
};

module.exports = CellularAutomata;

