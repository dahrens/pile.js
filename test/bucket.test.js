"use strict";

import { assert } from 'chai';

import { Bucket } from 'src/bucket';
import { Human, Brain } from 'test/lib/config';


describe('Bucket', function() {
  let bucket,
      fooman,
      brain

  beforeEach(function() {
    bucket = new Bucket();
    brain = new Brain();
    fooman = new Human("fooman", brain);
  });

  it('should handle object changes behind the scene', function(done) {
    bucket.add(fooman);
    fooman.name = "renamed";
    bucket.get(fooman._id, function(err, reply) {
      assert.equal(reply.name, fooman.name, "bucket still knows the old value");
      done();
    });
  });

  describe('#register', function() {
    it('should add the mediator constructor to its known models', function() {
      bucket.register(Human);
      assert.equal(bucket.models['human'], Human);
    })
    it('should be able to handle many', function() {
      bucket.register(Brain);
      bucket.register(Human);
      assert.equal(bucket.models['brain'], Brain);
      assert.equal(bucket.models['human'], Human);
    });
    it('should not accept non Mediators', function() {
      assert.throw(function () {
        bucket.register(Object);
      }, "Must be a subclass of Mediator");
    });
  });

  describe('#add', function () {
    beforeEach(function() {
      bucket.register(Human);
    });
    it('should add the given obj to the internal map', function () {
      bucket.add(fooman);
      assert.equal(bucket.memory.get(fooman._id), fooman);
    });
    it('should also accept lists of objects', function() {
      var barman = new Human('barman');
      bucket.add([fooman, barman]);
      assert.equal(bucket.memory.size, 2);
    });
    it('should throw an error if obj does not inherit "Mediator"', function() {
      try {
        bucket.add(new Object());
        assert(false, "there should have been an error!")
      } catch (e) { assert.equal(e, "Must be a subclass of Mediator") }
    });
  });

  describe('#remove', function () {
    beforeEach(function() {
      bucket.register(Human);
    });
    it('should remove the given obj from the internal memory', function () {
      bucket.add(fooman);
      bucket.remove(fooman);
      assert.equal(bucket.memory.has(fooman._id), false);
    });
    it('should also accept lists of objects', function() {
      bucket.add([fooman, brain]);
      assert.equal(bucket.memory.size, 2);
      bucket.remove([fooman, brain]);
      assert.equal(bucket.memory.size, 0);
    });
  });

  describe("#get", function() {
    beforeEach(function() {
      bucket.register(Human);
    });
    it("should answer with error on unknown id requests", function(done) {
      var _id = 'default:notvalid'
      bucket.get(_id, function(err, obj) {
        assert.equal(err, "Can not find id " + _id);
        done()
      })
    });
    it("should resolve objects properly by id", function() {
      bucket.add(fooman);
      bucket.get(fooman._id, function(err, obj) {
        assert.equal(fooman instanceof Human, obj instanceof Human);
        assert.equal(fooman.toJSON(), obj.toJSON());
        assert.equal(fooman, obj);
      })
    });
  })
});
