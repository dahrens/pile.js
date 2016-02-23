"use strict";
import { assert } from 'chai';

import { createClient } from 'redis';

import { RedisBottom } from 'src/bottom';
import { Mediator } from 'src/mediator';
import { Human, Brain } from 'test/lib/config';


describe('RedisBottom', function() {
  /**
   * NOTE: This testsuite currently relies on a *running redis* instance.
   * I am at the moment not familiar with redis. That's why i need to
   * see how it behaves in certain cases.
   * Although it does not strictly follow the idea of unit testing it
   * will stay like this for now.
   */
  var test;
  var redis_cleanup = function(done) {
    test.keys('mocha*', function(err, rows) {
      let async = require("async");
      async.each(rows, function(row, cb) {
        test.del(row, cb)
      }, done);
    });
  }


  before(function(done) {
    test = createClient();
    test.on("error", done);
    test.on("ready", done);
  });
  after(redis_cleanup);

  var redis_bottom,
      client,
      buck,
      fooman,
      brain;
  beforeEach(function() {
    redis_bottom = new RedisBottom("mocha");
    client = redis_bottom.client;

    buck = new Mediator({
      model: 'chicken',
      id: 'buck'
    });
    brain = new Brain();
    fooman = new Human("fooman", brain);
  });
  describe('#ground', function() {
    it('should convert simple objects for usage with redis.hmset', function() {
      let alloy = redis_bottom.ground(buck);
      assert(alloy);
      assert.equal(alloy.length, 5);
      assert.deepEqual(alloy, ['chicken:buck', 'id', 'buck', 'model', 'chicken'])
    });
    it('should convert objects with refs for usage with redis.hmset', function() {
      let alloy = redis_bottom.ground(fooman);
      assert(alloy);
      assert.equal(alloy.length, 9);
      assert.deepEqual(alloy, ['human:' + fooman.id, 'id', fooman.id, 'model', 'human', 'name', 'fooman', 'brain', 'brain:' + brain.id])
    });
  });
  describe('#write', function() {
    afterEach(redis_cleanup);
    it('should persist simple mediator in redis hashmap.', function(done) {
      redis_bottom.write(buck);
      client.hgetall(buck._id, function(err, reply) {
        assert(!err);
        assert.equal(JSON.stringify(reply), buck.toJSON());
        done();
      });
    });
    it('should persist lists of mediators in redis hashmap.', function(done) {
      redis_bottom.write([buck, fooman]);
      client.hgetall(buck._id, function(err, reply) {
        assert(!err);
        assert.equal(JSON.stringify(reply), buck.toJSON());
        done();
      });
    });
    it('should persist lists of mediators in redis hashmap.', function(done) {
      redis_bottom.write([buck, fooman]);
      client.hgetall(fooman._id, function(err, reply) {
        assert(!err);
        assert.equal(JSON.stringify(reply), fooman.toJSON());
        done();
      });
    });
  });
  describe('#read', function() {
    let brain,
        human,
        junction
    beforeEach(function() {
      // lets fake redis content of a human with a referred brain.
      brain = new Brain();
      human = new Human();
      redis_bottom.write([human, brain]);
    });
    afterEach(redis_cleanup);
    it('returns a map with all models and junctions', function(done) {
      redis_bottom.read(function(models) {
        assert(models.get(brain._id));
        assert(models.get(human._id));
        done();
      });
    });
  });
});
