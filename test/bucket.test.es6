"use strict";

import { assert } from 'chai';
import { spy, stub } from 'sinon';

import { Bucket, Junction } from 'src/bucket';
import { Bottom } from 'src/bottom';
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
    let bottom = stub()
    let bocket = new Bucket('awesome', {}, bottom);
    assert(bottom.withArgs('awesome').called, "no bottom created?");
  });
  it('should handle object changes behind the scene', function() {
    bucket.add(fooman);
    fooman.name = "renamed";
    let reply = bucket.get(fooman._id);
    assert.equal(reply.name, fooman.name, "bucket still knows the old value");
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
      let juncId = 'junction:' + fooman._id + ':' + brain._id
      assert.equal(mirror.memory.get(juncId), bucket.memory.get(juncId));
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
      assert.equal(bucket.memory.size, 3, "something is missing in da bucket.");
      assert(bucket.memory.get(fooman._id), "No fooman in bucket.");
      assert(bucket.memory.get(brain._id), "No brain in the bucket!");
      assert(bucket.memory.get('junction:' + fooman._id + ':' + brain._id),
        "No juntion between fooman and his brain in the bucket!");
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
    it("should answer with undefined on unknown id requests", function() {
      var _id = 'default:notvalid'
      assert(bucket.get(_id) === undefined);
    });
    it("should resolve objects properly by id", function() {
      bucket.add(fooman);
      let obj = bucket.get(fooman._id);
      assert.equal(fooman instanceof Human, obj instanceof Human);
      assert.equal(fooman.toJSON(), obj.toJSON());
      assert.equal(fooman, obj);
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
      delete: spy(),
      read: spy()
    }
    bucket = new Bucket('mocha', {
      'brain': Brain
    });
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
    it('should show a warning, if you add not registered models to a Bucket with a Bottom', function() {
      stub(console, 'warn');
      bucket.add(new Human());
      assert(console.warn.called, "There was no warning.");
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


  describe('#sync', function() {
    var empty_bucket, new_bottom, pinky, brain, pinkbrain;
    beforeEach(function() {
      pinky = new Brain();
      brain = new Human("pinkbrain", pinky);
      pinkbrain = new Junction(brain, pinky);
      class FakedBottom extends Bottom {
        get namespace() { return 'mocha' }
        read(cb) {
          let content = new Map();
          content.set(pinky._id, pinky._data);
          content.set(brain._id, brain._data);
          content.set(pinkbrain._id, pinkbrain._data);
          cb(content);
        }
      }
      new_bottom = new FakedBottom()
      empty_bucket = new Bucket('mocha', {
        'brain': Brain,
        'human': Human
      }, new_bottom);
    });


    it("should call a method and passes itself completely restored.", function(done) {
      empty_bucket.sync(function(bucket) {
        let restored_pinky = bucket.get(pinky._id);
        let restored_brain = bucket.get(brain._id);
        assert(bucket, "we got nothing from the bucket");
        assert(bucket.memory instanceof Map, "not a Map");
        assert(restored_pinky, "No pinky");
        assert.equal(restored_pinky._id, pinky._id, "Pinky has a new _id?");
        assert.equal(restored_pinky.id, pinky.id, "Pinky has new id?");
        assert.deepEqual(restored_pinky._data, pinky._data, "This is not our Pinky :(");
        assert.equal(restored_pinky.think(), "ARGH!", "Brain can't think");
        assert(restored_brain, "No brain");
        assert(bucket.memory.get(pinkbrain._id), "No pinkbrain");
        assert(restored_brain.brain.think() === "ARGH!", "Brain can't think");
        done();
      });
    });
    it("should listen on changes for restored data!", function(done) {
      empty_bucket.sync(function(bucket) {
        let restored_brain = bucket.get(brain._id);
        assert.equal(restored_brain._id, brain._id, "Pinky has a new _id?");
        restored_brain.name = "changed!";
        assert(bucket.get(brain._id).name === restored_brain.name, "changes do not affect the bucket");
        done();
      });
    });
  });
});
