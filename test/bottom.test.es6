"use strict";
import { assert } from 'chai';

import { createClient } from 'redis';
import * as async from 'async';

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

  let redis_bottom,
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
    it('should persist more than one mediator', function(done) {
      async.each([fooman, brain], function(obj, cb) {
        redis_bottom.write(obj, cb);
      }, function() {
          async.each([fooman, brain], function(obj, clbac) {
            client.hgetall(obj._id, function(err, reply) {
              assert(!err, "an error occured");
              assert(reply, "no reply");
              assert.equal(reply.id, obj.id, "wrong id!");
              assert.equal(reply.model, obj.model, "wrong model!");
              clbac();
            });
        }, done)
      });
    });
  });
  describe('#read', function() {
    beforeEach(function(done) {
      // lets fake redis content of a human with a referred brain.
      redis_bottom.write(fooman);
      redis_bottom.write(brain);
      client.exists(brain._id, done);
    });
    afterEach(redis_cleanup);
    it('returns a map with all models and junctions', function(done) {
      redis_bottom.read(function(models) {
        assert(models.get(brain._id));
        assert(models.get(fooman._id));
        done();
      });
    });
  });
  describe('#delete', function() {
    beforeEach(function(done) {
      redis_bottom.write(brain, function(err, reply) { done() });
    });
    it('deletes the hashmap for the given id', function(done) {
      redis_bottom.delete(brain._id);
      client.exists(brain._id, function(err, reply) {
        assert(reply === 0, "hashmap still exists.");
        done()
      })
    });
  });
});
