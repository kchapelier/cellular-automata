# cellular-automata

## Installing and testing

With [npm](http://npmjs.org) do:

```
npm install cellular-automata
```

To run the test suite, run the following command from the ```cellular-automata``` directory:

```
npm test
```

## Features

- Doesn't have any dependency to the DOM.
- Can easily apply different successive rules.
- Can be used in any dimension (1D, 2D, 3D and more).
- Allow the cellular automata rules to be passed as a string in one of several common CA rule format, see [cellular-automata-rule-parser]().

## Usage

### Code

```js
var CellularAutomata = require('cellular-automata');

// create a cellular automata with width of 200 cells and a height of 80 cells
var cellularAutomata = new CellularAutomata([200, 80]);

// fill the array with 95% of 0 values and 5% of 1 values
cellularAutomata.fillWithDistribution([[0, 95], [1, 5]]);

// define that the value out of the array should be interpreted as 0 values
cellularAutomata.setOutOfBoundValue(0);

cellularAutomata.setRule('23/3').iterate(5); // apply 5 times the S23/B3 rule (conway's life)
cellularAutomata.setRule('135/17').iterate(3); // apply 3 times the S135/B17 rule
cellularAutomata.setRule('234/12345678').iterate(5); // apply 5 times the S234/B12345768 rule

console.log(cellularAutomata.array); // ndarray containing the result
```

### Result as an image

<img src="https://github.com/kchapelier/cellular-automata/raw/master/readme1.png" style="image-rendering:pixelated; width:400px;"></img>

### Code

```js
// create a cellular automata with width of 75 cells and a height of 75 cells
var cellularAutomata = new CellularAutomata([75, 75]);

// use the fluent interface and the shortcut method "apply"
cellularAutomata
    .setOutOfBoundValue(1)
    .apply('23/3', 16)
    .apply('23456/45678', 16)
    .apply('23456/478', 16);

console.log(cellularAutomata.array); // ndarray containing the result
```

### Result as an image

<img src="https://github.com/kchapelier/cellular-automata/raw/master/readme2.png" style="image-rendering:pixelated; width:150px;"></img>

## Public API

### Constructor

**new CellularAutomata(shape[, defaultValue = 0])**

- *shape :* Shape of the grid (ie: [800,600] for a 2d grid of 800 cells of width and 600 cells of height).
- *defaultValue :* Default value of the cells.

### Methods

All methods are chainable

**setOutOfBoundValue([outOfBoundValue = 0])**

Define the value used for the neighbours out of the array's bounds.

- *outOfBoundValue :* The value to use, either an integer or the string "wrap" to enable grid wrapping.

**fillWithDistribution(distribution[, rng = Math.random])**

Fill the grid with a given distribution.

- *distribution :* An array of two dimensions representing the distribution to fill the grid with. (ie: [[0,90], [1,10]] for 90% of 0 and 10% of 1). Null values are ignored.
- *rng :* A function used as random number generator, defaults to Math.random.

**setRule(rule[, neighbourhoodType[, neighbourhoodRange = 1]])**

Define the rule of the cellular automata and the neighbourhood to be used.

- *rule :* Either a valid rule string (see [cellular-automata-rule-parser](https://www.npmjs.com/package/cellular-automata-rule-parser)) or a function taking as arguments the value of the current cell and an array containing the values of all its neighbours.
- *neighbourhoodType :* Neighbourhood type (moore, von-neumann, axis, corner, edge or face), only used when the rule is a function.
- *neighbourhoodRange :* Neighbourhood range, only used when the rule is a function.

**iterate([iterations = 1])**

Apply the previously defined CA rule multiple times.

- *iteration :* Number of iterations.

**apply(rule[, iterations = 1[, neighbourhoodType[, neighbourhoodRange = 1]]])**

Apply a given rule for a given number of iterations, shortcut method for setRule and iterate.

- *rule :* Either a valid rule string (see [cellular-automata-rule-parser](https://www.npmjs.com/package/cellular-automata-rule-parser)) or a function taking as arguments the value of the current cell and an array containing the values of all its neighbours.
- *iteration :* Number of iterations.
- *neighbourhoodType :* Neighbourhood type (moore, von-neumann, axis, corner, edge or face), only used when the rule is a function.
- *neighbourhoodRange :* Neighbourhood range, only used when the rule is a function.

### Properties

**shape**

The shape of the grid.

**dimension**

The dimension of the grid.

**array**

The ndarray containing all the current data in the grid.

## Changelog

0.1.0 (2015-11-02) :

- Update the rule parser.
- Supports unconventional neighbourhood types (axis, corner, edge and face).
- Sort neighbourhood to allow position dependent rules.

0.0.3 (2015-10-17) :

- Update the rule parser.

0.0.2 (2015-10-13) :

- Update the rule parser.

0.0.1 (2015-10-04) :

- First implementation.

## Roadmap

- More tests.

## License

MIT

## Learn more about cellular automata

- [Mirek Wójtowicz's Cellular Automata rules lexicon for MCell](http://www.mirekw.com/ca/ca_rules.html)
- [Cellular Automata Theory in Cellab's manual](https://www.fourmilab.ch/cellab/manual/chap4.html)
- [Wolfram's Elementary Cellular Automaton](http://mathworld.wolfram.com/ElementaryCellularAutomaton.html)
- [Golly](http://golly.sourceforge.net/)
- [Cellular Automaton on Wikipedia](https://en.wikipedia.org/wiki/Cellular_automaton)
