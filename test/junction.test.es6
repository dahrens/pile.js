'use strict';

import { assert } from 'chai';
import { spy, stub } from 'sinon';

import { Junction } from 'src/junction';
import { Human, Brain } from 'test/lib/config';


describe('Junction', function() {
  var junc, pinky, brain;
  beforeEach(function() {
    pinky = new Brain();
    brain = new Brain();
    junc = new Junction(pinky, brain);
  });
  it('should have an id that is easily reproduceable with ids', function() {
    assert.equal(junc._id, 'junction:' + pinky._id + ':' + brain._id);
  });
  it('should have ids in from and to', function() {
    assert.equal(junc.from, pinky._id);
    assert.equal(junc.to, brain._id);
  });
  it('should be constructable with ids instead of objects.', function() {
    let junction = new Junction(pinky._id, brain._id);
    assert.equal(junction._id, 'junction:' + pinky._id + ':' + brain._id);
    assert.equal(junction.from, pinky._id);
    assert.equal(junction.to, brain._id);
  });
});
