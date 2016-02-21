"use strict";

import { assert } from 'chai';
import { spy } from 'sinon';

import { Bucket, Junction } from 'src/bucket';
import { Human, Brain } from 'test/lib/config';


describe('Bucket', function() {
  let bucket,
      fooman,
      brain

  beforeEach(function() {
    bucket = new Bucket('mocha');
    brain = new Brain();
    fooman = new Human("fooman", brain);
  });

  it('should create a bucket with correct namespace', function() {
    let bottom = spy()
    let bocket = new Bucket('awesome', {}, bottom);
    assert(bottom.withArgs('awesome').called);
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

  describe('#subscribe', function () {
    var mirror;
    beforeEach(function() {
      mirror = new Bucket('mirror');
    });
    it('should allow buckets the subscription.', function() {
      bucket.subscribe(mirror);
      bucket.add(brain);
      assert.equal(mirror.memory.get(brain._id), bucket.memory.get(brain._id));
      bucket.add(fooman);
      assert.equal(mirror.memory.get(fooman._id), bucket.memory.get(fooman._id));
      assert.equal(mirror.memory.get('junction:' + fooman._id + ':' + brain._id), bucket.memory.get('junction:' + fooman._id + ':' + brain._id));
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
      let fooman = new Human('fooman');
      let barman = new Human('barman');
      bucket.add([fooman, barman]);
      assert.equal(bucket.memory.size, 2);
    });
    it('should throw an error if obj does not inherit "Mediator"', function() {
      try {
        bucket.add(new Object());
        assert(false, "there should have been an error!")
      } catch (e) { assert.equal(e, "Must be a subclass of Mediator") }
    });
    it('should add referred mediators and juntions.', function() {
      bucket.add(fooman);
      assert.equal(bucket.memory.size, 3, "something is missing in the bucket.");
      assert(bucket.memory.get(fooman._id), "No fooman in bucket.");
      assert(bucket.memory.get(brain._id), "No brain in the bucket!");
      assert(bucket.memory.get('junction:' + fooman._id + ':' + brain._id), "No juntion between fooman and his brain in the bucket!");
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
      bucket.remove([fooman,brain]);
      assert(!bucket.memory.get(fooman._id));
      assert(!bucket.memory.get(brain._id));
    });
    it('should remove children automatically', function() {
      bucket.add(fooman);
      assert(bucket.memory.get(brain._id));
      bucket.remove(fooman);
      assert(!bucket.memory.get(fooman._id));
      assert(!bucket.memory.get(brain._id));
    });
    it('should handle removal of junctions', function() {
      bucket.add(fooman);
      assert(bucket.memory.get('junction:'+fooman._id+':'+brain._id));
      bucket.remove(fooman);
      assert(!bucket.memory.get(fooman._id));
      assert(!bucket.memory.get(brain._id));
      assert(!bucket.memory.get('junction:'+fooman._id+':'+brain._id));
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

describe('Junction', function() {
  var junc, pinky, brain;
  beforeEach(function() {
    pinky = new Brain();
    brain = new Brain();
    junc = new Junction(pinky, brain);
  })
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
  })
});


describe('Bucket with Bottom set.', function() {
  let bottom,
      bucket,
      pinky,
      brain

  beforeEach(function() {
    bottom = {
      write: spy(),
      delete: spy()
    }
    bucket = new Bucket();
    bucket.bottom = bottom;
    brain = new Brain();
    pinky = new Brain();
  });
  describe('#add', function() {
    it('should call write for one added mediator', function() {
      bucket.add(brain);
      assert(bottom.write.withArgs(brain).called, "has not called bottom.write at all");
    });
    it('should call write for more added mediators', function() {
      bucket.add([pinky, brain]);
      assert(bottom.write.withArgs(pinky).calledOnce, "has not called bottom.write with pinky");
      assert(bottom.write.withArgs(brain).calledOnce, "has not called bottom.write with brain");
    });
  });
  describe('#remove', function() {
    beforeEach(function() {
      bucket.add([pinky, brain]);
    })
    it('should call write for one added mediator', function() {
      bucket.remove(brain);
      assert(bottom.delete.withArgs(brain._id).called, "has not called bottom.delete with brain._id");
    });
    it('should call delete for more added mediators', function() {
      bucket.remove([pinky, brain])
      assert(bottom.delete.withArgs(pinky._id).calledOnce, "has not called bottom.delete with pinky._id");
      assert(bottom.delete.withArgs(brain._id).calledOnce, "has not called bottom.delete with brain._id");
    });
  });
});
