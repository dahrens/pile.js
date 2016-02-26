"use strict";

import { assert } from 'chai';
import { spy, stub, createStubInstance } from 'sinon';

import { Junction } from 'src/bucket';
import { Jar } from 'src/jar';
import { Bottom } from 'src/bottom';
import { Human, Brain } from 'test/lib/config';


describe('Jar', function() {
  let bottom,
      jar,
      pinky,
      brain

  beforeEach(function() {
    bottom = createStubInstance(Bottom);
    jar = new Jar('mocha', {
      'brain': Brain
    }, bottom);
    jar.bottom = bottom;
    brain = new Brain();
    pinky = new Brain();
  });

  describe('constructor', function() {
    it('should create a jar with correct namespace', function() {
      var BottomStub = spy(function() {
        return createStubInstance(Bottom);
      });
      let jar = new Jar('awesome', {}, BottomStub);
      assert(BottomStub.withArgs('awesome').called, "no jar created?");
    });
  })

  describe('#register', function() {
    it('should add the mediator constructor to its known models', function() {
      jar.register(Human);
      assert.equal(jar.models['human'], Human);
    })
    it('should be able to handle many', function() {
      jar.register(Brain);
      jar.register(Human);
      assert.equal(jar.models['brain'], Brain);
      assert.equal(jar.models['human'], Human);
    });
    it('should not accept non Mediators', function() {
      assert.throw(function () {
        jar.register(Object);
      }, "Must be a subclass of Mediator");
    });
  });

  describe("#restore", function() {
    let restored,
        data;
    beforeEach(function() {
      jar.register(Brain);
      data = {id: 'id', model:'brain'};
      restored = jar.restore('brain:id', data);
    });
    it("should construct a fresh model based on my data!", function() {
       assert(restored instanceof Brain, "it has the wrong class");
       assert.deepEqual(restored._data, data, "data is not equal");
    });
    it("should fail on unknown models", function() {
      assert.throws(function() {
        bucket.restore('unknown:id', {});
      });
      assert.throws(function() {
        bucket.restore('unknown-id', {});
      });
    });
  });

  describe('#add', function() {
    it('should call write for one added mediator', function() {
      jar.add(brain);
      assert(bottom.write.withArgs(brain).called, "has not called bottom.write at all");
    });
    it('should call write for more added mediators', function() {
      jar.add([pinky, brain]);
      assert(bottom.write.withArgs(pinky).calledOnce, "has not called bottom.write with pinky");
      assert(bottom.write.withArgs(brain).calledOnce, "has not called bottom.write with brain");
    });
    it('should show a warning, if you add not registered models to a Bucket with a Bottom', function() {
      stub(console, 'warn');
      jar.add(new Human());
      assert(console.warn.called, "There was no warning.");
    });
  });


  describe('#remove', function() {
    beforeEach(function() {
      jar.add([pinky, brain]);
    })
    it('should call write for one added mediator', function() {
      jar.remove(brain);
      assert(bottom.delete.withArgs(brain._id).called, "has not called bottom.delete with brain._id");
    });
    it('should call delete for more added mediators', function() {
      jar.remove([pinky, brain])
      assert(bottom.delete.withArgs(pinky._id).calledOnce, "has not called bottom.delete with pinky._id");
      assert(bottom.delete.withArgs(brain._id).calledOnce, "has not called bottom.delete with brain._id");
    });
  });


  describe('#sync', function() {
    var empty_jar,
        new_bottom,
        pinky,
        brain,
        pinkbrain;
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
      empty_jar = new Jar('mocha', {
        'brain': Brain,
        'human': Human
      }, new_bottom);
    });


    it("should call a method and passes itself completely restored.", function(done) {
      empty_jar.sync(function(bucket) {
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
      empty_jar.sync(function(bucket) {
        let restored_brain = bucket.get(brain._id);
        assert.equal(restored_brain._id, brain._id, "Pinky has a new _id?");
        restored_brain.name = "changed!";
        assert(bucket.get(brain._id).name === restored_brain.name, "changes do not affect the bucket");
        done();
      });
    });
  });
});
