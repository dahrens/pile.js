"use strict";

import { assert } from 'chai';

import { Mediator } from 'src/mediator';
import { Human, Brain } from 'test/lib/config';


describe('Mediator', function() {
  var data, m1, m2, fooman, brain;
  beforeEach(function() {
    data = {id: 'testid', model: 'testmodel', prop: 'value'};
    m1 = new Mediator(data);
    m2 = new Mediator(data);
    fooman = new Human("fooman");
    brain = new Brain();
  })
  it('should have getters for the underlying data object', function () {
    assert.equal(m1.prop, data.prop);
    assert.equal(fooman.name, "fooman");
    assert.equal(fooman.brain, null);
  });
  it('should only contains data that came in plus model and id', function () {
    assert.deepEqual(m1._data, data);
  });
  it('should have setters for the underlying data object', function () {
    m1.prop = 'changed';
    assert.equal(m1.prop, 'changed');
    fooman.brain = brain;
    assert(fooman.brain, "no brain!");
    assert.equal(fooman.brain.think(), "ARGH!");
  });
  it('can be constructed with references to a single mediator.', function() {
    let brainz = new Brain();
    let humanz = new Human("humanz!", brainz);
    assert(humanz.brain, "no brain!");
    assert.equal(humanz._data['brain'],brainz._id);
    for (let ref of humanz.refs) {
      assert.equal(ref, brainz);
    }
  });
  it('can be constructed with references to a list of mediators object.', function() {
    let brainz = new Brain();
    let humanz = new Human("humanz!", brainz);
    assert(humanz.brain, "no brain!");
    assert.equal(humanz._data['brain'],brainz._id);
    for (let ref of humanz.refs) {
      assert.equal(ref, brainz);
    }
  });
  it('should always have an id and model set.', function () {
    assert(m1.hasOwnProperty('id'));
    assert(m1.hasOwnProperty('model'));
    assert(m2.hasOwnProperty('id'));
    assert(m2.hasOwnProperty('model'));
    assert(fooman.hasOwnProperty('id'));
    assert(fooman.hasOwnProperty('model'));
    assert(brain.hasOwnProperty('id'));
    assert(brain.hasOwnProperty('model'));
  });

  it('should always have an persistent id prefixed with correct model in _id', function() {
    assert(m1._id);
    assert(m2._id);
    assert(fooman._id);
    assert(brain._id);
    assert.equal(m1._id, 'testmodel:' + m1.id);
    assert.equal(m2._id, 'testmodel:' + m2.id);
    assert.equal(fooman._id, 'human:' + fooman.id);
    assert.equal(brain._id, 'brain:' + brain.id);
    let m3 = new Mediator({id:'cheated'});
    assert.equal(m3._id, 'default:cheated');
  })

  it('should fire "changed" on change', function(done) {
    var errTimeout = setTimeout(function () {
      assert(false, '"changed" event never fired');
      done();
    }, 1000);

    m1.on('changed', function(m, data){
      clearTimeout(errTimeout);
      assert.equal(m.prop, 'changed');
      assert.equal(data.prop, 'prop');
      assert.equal(data.old, 'value');
      assert.equal(m instanceof Mediator, true);
      done();
    });
    m1.prop = 'changed';
  });
  it('should fire "changed" on changed with mediators', function(done) {
    var errTimeout = setTimeout(function () {
      assert(false, '"changed" event never fired');
      done();
    }, 1000);

    fooman.on('changed', function(foo, data) {
      clearTimeout(errTimeout);
      assert(foo);
      assert(data);
      assert(foo.brain);
      assert.equal(data.prop, 'brain');
      assert.equal(data.old, null);
      assert.equal(foo.brain.think(), "ARGH!");
      done();
    });

    fooman.brain = brain;
  });

  describe('#toJSON', function() {
    it('should return the data property as json string', function() {
      var data = {id: 'foo'}
      var m1 = new Mediator(data);
      assert.equal(m1.toJSON(), '{"id":"foo","model":"default"}');
      data = {id: 'foo', "foo":"bar"}
      m1 = new Mediator(data);
      assert.equal(m1.toJSON(), '{"id":"foo","model":"default","foo":"bar"}');
    });
    it('should not include _id', function() {
      var data = {id: 'foo'}
      var m1 = new Mediator(data);
      assert.equal(m1.toJSON().indexOf("_id"), -1);
    });
    it('should include _id of subclasses, but not the subclass.', function() {
      fooman.brain = brain
      assert(JSON.parse(fooman.toJSON()).brain, brain._id);
    });
  });
});
