"use strict";

import EventEmitter from 'events';
import { generate } from 'shortid';
import { Mediator } from 'src/mediator';


/**
 * Appends a 's' to the given string.
 */
function pluralize(s) { return s + 's'; }


/**
 * Resolves the modelName from in _id (persistence id).
 */
function modelNameFromId(_id) {
    let modelName = _id.split(':')[0];
    if (!modelName) {
        throw "No known modelName found in _id: " + _id;
    }
    return modelName
}


/**
 * Buckets are used to create your overall pile.
 * Use them to cluster your objects together.
 *
 * Buckets store data in a flat manner.
 */
export class Bucket extends EventEmitter {
  constructor(redis) {
      super();
      this.map = new Map();
      this.redis = redis;
      this.models = {}
  }

  /**
   * Registers a cls for this Bucket.
   *
   * This means that the Bucket is able to persist those objects
   * into his own Namespace as seperate objects.
   *
   * If object were added to this Bucket, which have references
   * to a cls that is known by the Bucket, it will save a reference
   * in the property of the refering object and creates an own instance
   * for the referred object.
   */
  register(cls) {
      let instance = new cls();
      if (!(instance instanceof Mediator)) {
        throw "Must be a subclass of Mediator"
      }
      this.models[instance.model] = cls
  }

  unregister(cls) {
      throw "to be done..."
  }

  _modelFromModelName(modelName) {
      let model = this.models[modelName]
      if (!model) {
        throw "No model class found for modelName: " + modelName;
      }
      return model
  }

  _modelFromId(_id) {
      return this._modelFromModelName(
        modelNameFromId(_id)
      );
  }

  /**
   * Asynchronous getter for mediators known by the Bucket.
   *
   * Error are handled in the callback method, that *must* be
   * provided if you want to receive a result.
   */
  get(_id, callback) {
      if (typeof _id !== "string") {
        throw "Must be a string"
      }
      var model = this._modelFromId(_id);
      let me = this;
      if (this.map.has(_id)) {
        callback.call(me, null, this.map.get(_id)); return;
      } else {
        this.redis.hgetall(_id, function(err, reply) {
          if (!reply) {
            callback.call(me, "Not found id " + _id, null);
          } else {
            me._add(new model(reply), false)
            callback.call(me, null, me.map.get(_id));
          }
        });
      }

  }

  /**
   * Adds one or more mediators to the Bucket.
   */
  add(mediators) {
    let arr = Array.isArray(mediators) ? mediators : [mediators]
    for (var i in arr) { this._add(arr[i]); }
  }

  /**
   * Adds one object to the Bucket.
   */
  _add(obj, persist=true) {
      var me = this;
      if (!(obj instanceof Mediator)) {
        throw "Must be a subclass of Mediator";
      } else {
        obj._bucket = me
        me.map.set(obj._id, obj);
        if (persist) {
          me.redis.sadd(pluralize(obj.model), obj._id);
          me._persist(obj)
        }

        obj.on("changed", function(obj, oldData) {
          me._persist(obj)
        })
      }
  }

  /**
   * Removes one or more objects from the Bucket.
   *
   * You can pass an id or an mediator or a list of both, mediators
   * and ids to this method.
   */
  remove(mediators) {


    let arr = Array.isArray(mediators) ? mediators : [mediators]
    for (var i in arr) { this._remove(arr[i]); }
  }

  /**
   * Removes one object from the bucket, either by id or mediator object.
   */
  _remove(mediator) {
    if (typeof mediator !== "string" && !(mediator instanceof Mediator)) {
      throw "Must be a subclass of Mediator or an id.";
    }
    let _id = (typeof mediator === "string") ? mediator : mediator._id;
    let model = modelNameFromId(_id);
    this.map.delete(_id);
    this.redis.srem(pluralize(model), _id);
    this.redis.del(_id);
  }

  _persist(obj) {
    let props = [];
    for (let prop in obj.data) {
      if (typeof obj[prop] === 'object') {
        // what if _id is not defined?
        props.push(prop, obj[prop]._id);
        this.add(obj[prop]);
      } else {
        props.push(prop, obj[prop]);
      }
    }
    this.redis.hmset(obj._id, props);
  }

  _read() {}
}


/**
 * Those were managed behind the scene by a Bucket.
 * For each junction between two Meditors there
 * will be a Junction available.
 */
class Junction {
  constructor() {}
}
