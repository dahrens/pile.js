"use strict";

import { assert } from 'chai';

import { createClient } from 'redis';
import { Bucket } from 'src/bucket';
import { Mediator, ForeignKeyProperty } from 'src/mediator'


class P1 extends Mediator {
  constructor(data={}) {
    data['model'] = 'P1'
    super(data)
  }
};

class P2 extends Mediator {
  constructor(data={}) {
    data['model'] = 'P2'
    super(data)
  }
};

class FooChild extends Mediator {
  constructor(data={}) {
    data['model'] = 'foochild'
    data['foo'] = 'bar';
    super(data);
  }

  execFoo() {
    return "Foo! " + this.foo;
  }
}

class BarChild extends Mediator {
  constructor(data={}) {
    data['model'] = 'barchild'
    data['bar'] = 'barchild'
    super(data);
  }

  bar() { return "Bar! " + this.bar }
}

class FooParent extends Mediator {
  constructor(data={}) {
    data['model'] = 'fooparent'
    super(data, {
      'fooChild': new ForeignKeyProperty({model: FooChild})
    })
  }
}


describe('Bucket', function() {
  let bucket,
      valid,
      redis;

  before(function() {
    redis = createClient({prefix:"mocha:"});

    redis.on("error", function(err) {
        console.error(err);
    });
  })

  beforeEach(function() {
    bucket = new Bucket(redis);
    valid = new Mediator({id: "my-id"});
  });

  after(function(){
    redis.flushall();
  });

  it('should handle object changes behind the scene', function(done) {
    var badoo = new Mediator({prop: "foo"})
    bucket.add(badoo);
    badoo.prop = "bar";
    bucket.redis.hgetall(badoo._id, function(err, reply) {
      assert.equal(reply.prop, badoo.prop, "in redis not updated...");
      done();
    });
  });

  describe('#register', function() {
    it('should add the mediator constructor to its known models', function() {
      bucket.register(Mediator);
      assert.equal(bucket.models['default'], Mediator);
    })
    it('should be able to handle many', function() {
      bucket.register(Mediator);
      bucket.register(P1);
      bucket.register(P2);
      assert.equal(bucket.models['default'], Mediator);
      assert.equal(bucket.models['P1'], P1);
      assert.equal(bucket.models['P2'], P2);
    });
    it('should not accept non Mediators', function() {
      assert.throw(function () {
        bucket.register(Object);
      }, "Must be a subclass of Mediator");
    });
  });

  describe('#add', function () {
    beforeEach(function() {
      bucket.register(Mediator);
    });
    it('should add the given obj to the internal map', function () {
      bucket.add(valid);
      assert.equal(bucket.map.get(valid._id), valid);
    });
    it('should add the given obj to the redis set', function (done) {
      bucket.add(valid);
      bucket.redis.sismember('defaults', valid._id, function(err, reply) {
        assert(!err);
        assert.equal(reply, true);
        done();
      });
    });
    it('should add the given obj to the redis hashmap', function (done) {
      bucket.add(valid);
      bucket.redis.hgetall(valid._id, function(err, reply) {
        assert(!err);
        assert.equal(JSON.stringify(reply), valid.toJSON());
        done();
      });
    });
    it('should also accept lists of objects', function() {
      var valid2 = new Mediator();
      bucket.add([valid, valid2]);
      assert.equal(bucket.map.size, 2);
    });
    it('should throw an error if obj does not inherit "Mediator"', function() {
      try {
        bucket.add(new Object());
        assert(false, "there should have been an error!")
      } catch (e) { assert.equal(e, "Must be a subclass of Mediator") }
    });
    it('should throw an error if obj is not of the correct subclass', function() {
      try {
        bucket.add(new Object());
        assert(false, "there should have been an error!")
      } catch (e) { assert.equal(e, "Must be a subclass of Mediator") }
    });
    it('should allow subclasses of "Mediator"', function() {
      class FooMediator extends Mediator {};
      try {
        var foo = FooMediator
        bucket.add(new FooMediator());
      } catch(e) {
        assert(false, e);
      }
    });
    it('should magically create references to known subtypes', function(done) {
      bucket.register(P1);
      var obj = new Mediator({
        id: 'master',
        child: new P1({
          id: 'child'
        })
      });

      bucket.add(obj);

      bucket.redis.hgetall(obj._id, function(err, reply) {
        assert(!err);
        assert.equal(reply.child, 'P1:child')
        done();
      });

    });
    it('should magically create own objects for known subtypes', function(done) {
      bucket.register(P1);
      var child = new P1({
        id: 'child'
      });
      var obj = new Mediator({
        id: 'master',
        child: child
      });

      bucket.add(obj);

      assert.equal(bucket.map.get('P1:child'), child);

      bucket.redis.hgetall('P1:child', function(err, reply) {
        assert(!err);
        assert(reply, "There should pop up another object automatically.");
        assert.equal(reply.id, 'child')
        assert.equal(reply.model, 'P1')
        done();
      });
    });

    it('should magically override persisted objects', function(done) {
      bucket.register(P1);
      var child = new P1({
        id: 'child',
        foo: 'bar'
      });
      bucket.add(child);
      var obj = new Mediator({
        id: 'master',
        child: child
      });
      obj.child.foo = 'batz'
      bucket.add(obj);
      bucket.redis.hgetall('P1:child', function(err, reply) {
        assert(!err);
        assert(reply, "There should pop up another object automatically.");
        assert.equal(reply.id, 'child')
        assert.equal(reply.model, 'P1')
        assert.equal(reply.foo, 'batz')
        done();
      });
    });
  });

  describe('#remove', function () {
    beforeEach(function() {
      bucket.register(Mediator);
    });
    it('should remove the given obj from the internal map', function () {
      bucket.add(valid);
      bucket.remove(valid);
      assert.equal(bucket.map.has(valid._id), false);
    });
    it('should remove the given obj from the redis hashmap', function (done) {
      bucket.add(valid);
      bucket.remove(valid._id);
      bucket.redis.exists(valid._id, function(err, reply) {
        assert(!err);
        assert.equal(reply, false);
        done();
      });
    });
    it('should remove the given obj from the mediators id-set', function (done) {
      bucket.add(valid);
      bucket.remove(valid._id);
      bucket.redis.sismember('defaults', valid._id, function(err, reply) {
        assert(!err);
        assert.equal(reply, false);
        done();
      });
    });
    it('should also accept lists of objects', function() {
      bucket.add(valid);
      var valid2 = new Mediator();
      bucket.add([valid, valid2]);
      bucket.remove([valid, valid2]);
      assert.equal(bucket.map.size, 0);
    });
  });

  describe("#get", function() {
    beforeEach(function() {
      bucket.register(Mediator);
    });
    it("should answer with error on unknown id requests", function(done) {
      var _id = 'default:notvalid'
      bucket.get(_id, function(err, obj) {
        assert.equal(err, "Not found id " + _id);
        done()
      })
    });
    it("should resolve objects properly by id", function() {
      bucket.add(valid);
      bucket.get(valid._id, function(err, obj) {
        assert.equal(valid instanceof Mediator, obj instanceof Mediator, obj);
        assert.equal(valid.toJSON(), obj.toJSON());
        assert.equal(valid, obj);
      })
    });
    it("can load objects with their children", function(done) {
      bucket.register(FooParent);
      bucket.register(FooChild);
      var child = new FooChild({
        id: 'child',
        foo: 'bar'
      });
      bucket.add(child);
      var part = new FooParent({
        id: 'master',
        fooChild: child
      });
      bucket.add(part);
      let bucket2 = new Bucket(redis);
      bucket2.register(FooParent);
      bucket2.register(FooChild);
      bucket2.get(part._id, function(err, obj) {
        assert.equal(
          part instanceof FooParent,
          obj instanceof FooParent,
          "wrong instance"
        );
        assert.equal(part.toJSON(), obj.toJSON(), "obj json serialized not equal");
        assert.equal(part.id, obj.id, "objects are not the same");
        obj.load('fooChild', function() {
          assert.equal(obj.fooChild.execFoo(), "Foo! bar");
          done();
        })
      })
    });
    it('should construct the correct object on get.', function(done) {
      bucket.register(P1);
      var p1 = new P1({"foo": "bar"});
      bucket.add(p1);
      let bucket2 = new Bucket(redis);
      bucket2.register(P1);
      bucket2.get(p1._id, function(err, obj) {
        assert.equal(
          p1 instanceof P1,
          obj instanceof P1,
          "wrong instance"
        );
        assert.equal(p1.toJSON(), obj.toJSON(), "obj json serialized not equal");
        assert.equal(p1.id, obj.id, "objects are not the same");
        done();
      });
    });
    it("should be able to resolve records from redis if they are not loaded.", function(done) {
      bucket.add(valid);
      bucket.map = new Map();
      bucket.get(valid._id, function(err, obj) {
        assert.equal(
          valid instanceof Mediator,
          obj instanceof Mediator,
          "wrong instance"
        );
        assert.equal(valid.toJSON(), obj.toJSON(), "obj json serialized not equal");
        assert.equal(valid.id, obj.id, "objects are not the same");
        done();
      })
    });
  })
});
