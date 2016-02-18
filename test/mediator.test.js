"use strict";

import { assert } from 'chai';
import { format } from 'util';

import { createClient } from 'redis';
import { Mediator } from 'src/mediator';


describe('Mediator', function() {
  var data, mediator;
  beforeEach(function() {
    data = {prop: 'value'};
    mediator = new Mediator(data);
  })
  it('should have getters for the underlying data object', function () {
    assert.equal(mediator.prop, data.prop);
  });
  it('should have setters for the underlying data object', function () {
    mediator.prop = 'changed';
    assert.equal(mediator.prop, 'changed');
  });

  it('should always have an id and model set.', function () {
    mediator.prop = 'changed';
    assert(mediator.hasOwnProperty('id'));
    assert(mediator.hasOwnProperty('model'));
  });

  it('should always have an persistent id in _id', function() {
    assert(mediator._id);
    assert.equal(mediator._id, mediator.model + ':' + mediator.id);
  })

  it('should not fire "changed" on setter call with same value', function(done) {
    var errTimeout = setTimeout(function () {
      assert(true, '"changed" never fired');
      done();
    }, 20);

    mediator.on('changed', function(oldData){
      clearTimeout(errTimeout);
      assert(false);
      done();
    });
    mediator.prop = 'value';
  });

  describe('Events', function () {
    it('should fire "changed" on change', function(done) {
      var errTimeout = setTimeout(function () {
        assert(false, '"changed" event never fired');
        done();
      }, 1000);

      mediator.on('changed', function(p, old){
        clearTimeout(errTimeout);
        assert.equal(p.prop, 'changed');
        assert.equal(old.prop, 'value');
        assert.equal(p instanceof Mediator, true);
        assert.equal(old instanceof Mediator, false);
        done();
      });
      mediator.prop = 'changed';
    });
  });

  describe('#toJSON', function() {
    it('should return the data property as json string', function() {
      var data = {id: 'foo'}
      var mediator = new Mediator(data);
      assert.equal(mediator.toJSON(), '{"id":"foo","model":"default"}');
      data = {id: 'foo', "foo":"bar"}
      mediator = new Mediator(data);
      assert.equal(mediator.toJSON(), '{"id":"foo","model":"default","foo":"bar"}');
    });
    it('should not include _id', function() {
      var data = {id: 'foo'}
      var mediator = new Mediator(data);
      assert.equal(mediator.toJSON().indexOf("_id"), -1);
    });
  });
});


class Chicken extends Mediator {
  constructor(name='buckbuck') {
    super({
      model: 'chicken',
      name: name
    });
  }

  pick(thing) {
    return format('Chicken %s picks up %s!', this.name, thing);
  }
}


describe('Mediators can easily be subclassed', function() {
  var buckbuck, happy;

  beforeEach(function() {
    buckbuck = new Chicken();
    happy = new Chicken('happy');
  });
  it('constructors can take arguments', function() {

    assert.equal(buckbuck.pick("a corn"), "Chicken buckbuck picks up a corn!");
    assert.equal(happy.pick("a corn"), "Chicken happy picks up a corn!");
  });
});
