'use strict';

import { assert } from 'chai';
import { spy, stub } from 'sinon';

import { Bucket } from 'src/bucket';
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
      bucket.subscribe(mirror);
      bucket.add(brain);
      bucket.add(fooman);
    });
    it('should synchronize add events', function() {
      assert.equal(mirror.memory.get(brain._id), bucket.memory.get(brain._id));
      assert.equal(mirror.memory.get(fooman._id), bucket.memory.get(fooman._id));
      let juncId = 'junction:' + fooman._id + ':' + brain._id;
      assert.equal(mirror.memory.get(juncId), bucket.memory.get(juncId));
    });
    it('should synchronize remove events', function() {
      bucket.remove(brain);
      assert.equal(mirror.memory.get(brain._id), undefined, "was not removed");
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
    it('should throw an error on wrong datatypes', function() {
      assert.throws(function() {
        bucket.remove(4)
      })
      assert.throws(function() {
        bucket.remove(new Object)
      })
      assert.throws(function() {
        bucket.remove([3, new Object])
      })
    })
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
    it('should only accept strings', function() {
      assert.throws(function() {
          bucket.get(new Object);
      })
    })
  });

  describe('#toJSON', function() {
    beforeEach(function() {
      bucket.add([fooman]);
    });
    it('should include contained objects', function() {
      console.log(bucket.toJSON());
    })
  });
});
