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

- Doesn't have any dependency to the DOM (no canvas element)
- Can easily apply different successive rules
- Can be used in any dimension (1D, 2D, 3D ad more).
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

console.log(cellularAutomata.currentArray); // ndarray containing the result
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

console.log(cellularAutomata.currentArray); // ndarray containing the result
```

### Result as an image

<img src="https://github.com/kchapelier/cellular-automata/raw/master/readme2.png" style="image-rendering:pixelated; width:150px;"></img>

## Changelog

...

## Roadmap

...

## License

MIT

## Learn more about cellular automata

- [Mirek Wójtowicz's Cellular Automata rules lexicon for MCell](http://www.mirekw.com/ca/ca_rules.html)
- [Cellular Automata Theory in Cellab's manual](https://www.fourmilab.ch/cellab/manual/chap4.html)
- [Wolfram's Elementary Cellular Automaton](http://mathworld.wolfram.com/ElementaryCellularAutomaton.html)
- [Golly](http://golly.sourceforge.net/)
- [Cellular Automaton on Wikipedia](https://en.wikipedia.org/wiki/Cellular_automaton)
