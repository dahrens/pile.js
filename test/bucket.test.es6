'use strict';

import { assert } from 'chai';
import { spy, stub } from 'sinon';

import { Bucket, Junction } from 'src/bucket';
import { Bottom } from 'src/bottom';
import { Human, Brain } from 'test/lib/config';


describe('Bucket', function() {
  let bucket,
    fooman,
    brain;
  beforeEach(function() {
    bucket = new Bucket();
    brain = new Brain();
    fooman = new Human('fooman', brain);
  });


  it('should handle object changes behind the scene', function() {
    bucket.add(fooman);
    fooman.name = 'renamed';
    let reply = bucket.get(fooman._id);
    assert.equal(reply.name, fooman.name, 'bucket still knows the old value');
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
      let juncId = 'junction:' + fooman._id + ':' + brain._id;
      assert.equal(mirror.memory.get(juncId), bucket.memory.get(juncId));
    });
  });


  describe('#add', function () {
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
        assert(false, 'there should have been an error!');
      } catch (e) { assert.equal(e, 'Must be a subclass of Mediator'); }
    });
    it('should add referred mediators and juntions.', function() {
      bucket.add(fooman);
      assert.equal(bucket.memory.size, 3, 'something is missing in da bucket.');
      assert(bucket.memory.get(fooman._id), 'No fooman in bucket.');
      assert(bucket.memory.get(brain._id), 'No brain in the bucket!');
      assert(bucket.memory.get('junction:' + fooman._id + ':' + brain._id),
        'No juntion between fooman and his brain in the bucket!');
    });
  });


  describe('#remove', function () {
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

  describe('#get', function() {
    it('should answer with undefined on unknown id requests', function() {
      var _id = 'default:notvalid';
      assert(bucket.get(_id) === undefined);
    });
    it('should resolve objects properly by id', function() {
      bucket.add(fooman);
      let obj = bucket.get(fooman._id);
      assert.equal(fooman instanceof Human, obj instanceof Human);
      assert.equal(fooman.toJSON(), obj.toJSON());
      assert.equal(fooman, obj);
    });
  });
});

describe('Junction', function() {
  var junc, pinky, brain;
  beforeEach(function() {
    pinky = new Brain();
    brain = new Brain();
    junc = new Junction(pinky, brain);
  });
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
  });
});
