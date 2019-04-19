"use strict";

const moore = require('moore');
const vonNeumann = require('von-neumann');
const unconventionalNeighbours = require('unconventional-neighbours');

module.exports = {
  moore: moore,
  'von-neumann': vonNeumann,
  axis: unconventionalNeighbours.axis,
  corner: unconventionalNeighbours.corner,
  edge: unconventionalNeighbours.edge,
  face: unconventionalNeighbours.face
};