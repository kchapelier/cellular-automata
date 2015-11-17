"use strict";

var CA = require('../'),
    should = require('chai').should();

describe('Using different dimensions', function () {
    it('should support 1D', function () {
        var ca = new CA([3]);

        ca.dimension.should.equal(1);

        ca.currentArray.set(1, 1);

        ca.apply('1/1V', 1);

        // 1 0 1
        ca.currentArray.get(0).should.equal(1);
        ca.currentArray.get(1).should.equal(0);
        ca.currentArray.get(2).should.equal(1);
    });


    it('should support 2D', function () {
        var ca = new CA([3,3]);

        ca.dimension.should.equal(2);

        ca.currentArray.set(1, 1, 1);

        ca.apply('1/1V', 1);

        // 0 1 0
        ca.currentArray.get(0, 0).should.equal(0);
        ca.currentArray.get(1, 0).should.equal(1);
        ca.currentArray.get(2, 0).should.equal(0);

        // 1 0 1
        ca.currentArray.get(0, 1).should.equal(1);
        ca.currentArray.get(1, 1).should.equal(0);
        ca.currentArray.get(2, 1).should.equal(1);

        // 0 1 0
        ca.currentArray.get(0, 2).should.equal(0);
        ca.currentArray.get(1, 2).should.equal(1);
        ca.currentArray.get(2, 2).should.equal(0);
    });

    it('should support 3D', function () {
        var ca = new CA([3,3,3]);

        ca.dimension.should.equal(3);

        ca.currentArray.set(1, 1, 1, 1);

        ca.apply('1/1V', 1);


        // 0 0 0
        ca.currentArray.get(0, 0, 0).should.equal(0);
        ca.currentArray.get(1, 0, 0).should.equal(0);
        ca.currentArray.get(2, 0, 0).should.equal(0);

        // 0 1 0
        ca.currentArray.get(0, 1, 0).should.equal(0);
        ca.currentArray.get(1, 1, 0).should.equal(1);
        ca.currentArray.get(2, 1, 0).should.equal(0);

        // 0 0 0
        ca.currentArray.get(0, 2, 0).should.equal(0);
        ca.currentArray.get(1, 2, 0).should.equal(0);
        ca.currentArray.get(2, 2, 0).should.equal(0);



        // 0 1 0
        ca.currentArray.get(0, 0, 1).should.equal(0);
        ca.currentArray.get(1, 0, 1).should.equal(1);
        ca.currentArray.get(2, 0, 1).should.equal(0);

        // 1 0 1
        ca.currentArray.get(0, 1, 1).should.equal(1);
        ca.currentArray.get(1, 1, 1).should.equal(0);
        ca.currentArray.get(2, 1, 1).should.equal(1);

        // 0 1 0
        ca.currentArray.get(0, 2, 1).should.equal(0);
        ca.currentArray.get(1, 2, 1).should.equal(1);
        ca.currentArray.get(2, 2, 1).should.equal(0);



        // 0 0 0
        ca.currentArray.get(0, 0, 2).should.equal(0);
        ca.currentArray.get(1, 0, 2).should.equal(0);
        ca.currentArray.get(2, 0, 2).should.equal(0);

        // 0 1 0
        ca.currentArray.get(0, 1, 2).should.equal(0);
        ca.currentArray.get(1, 1, 2).should.equal(1);
        ca.currentArray.get(2, 1, 2).should.equal(0);

        // 0 0 0
        ca.currentArray.get(0, 2, 2).should.equal(0);
        ca.currentArray.get(1, 2, 2).should.equal(0);
        ca.currentArray.get(2, 2, 2).should.equal(0);
    });
});
