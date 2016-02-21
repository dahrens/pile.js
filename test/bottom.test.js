"use strict";

import { assert } from 'chai';

import { createClient } from 'redis';
import { RedisBottom } from 'src/bottom';
import { Mediator } from 'src/mediator'
import { Human, Brain } from 'test/lib/config';


describe('RedisBottom', function() {
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
  afterEach(function(done) {
    client.flushall(function() {
      done();
    });
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
    afterEach(function(done) {
      client.flushall(function() {
        done();
      });
    })
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
});
