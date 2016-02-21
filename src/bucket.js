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
  /**
   * Create a new Bucket, that can store different subclasses
   * of Mediator.
   */
  constructor(bottom) {
      super();
      /**
       * @type {Map} The inmemory store for the bucket.
       */
      this.memory = new Map();
      /**
       * @type {Object} An object with keys for models and classes as value.
       */
      this.models = {};
      /**
       * @type {Object} An Map with mediator._id => [list of junction _ids]
       */
      this.junctions = new Map();
      /**
       * @type {Object} A Bottom used for persisting objects somewhere.
       */
      this.bottom = bottom;
  }

  /**
   * Registers a cls for this Bucket.
   *
   * This means that the Bucket is able to persist those objects
   * into his own Namespace as seperate objects.
   *
   * @param {Mediator} cls The class that should be registered.
   */
  register(cls) {
      let instance = new cls();
      if (!(instance instanceof Mediator)) {
        throw "Must be a subclass of Mediator"
      }
      this.models[instance.model] = cls
  }

  /**
   * Unregister a class from this Bucket.
   *
   * @param {Mediator} cls The class that should be unregistered.
   */
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
      let me = this;
      if (this.memory.has(_id)) {
        callback.call(me, null, this.memory.get(_id));
      } else {
        if (this.bottom) {
          // TODO: what about loading from bottom?
        } else {
          callback.call(me, "Can not find id " + _id)
        }
      }
  }

  /**
   * Adds one or more mediators to the Bucket.
   */
  add(iter) {
    let mediators = iter[Symbol.iterator] !== undefined ? iter : [iter]
    for (let mediator of mediators) {
      this._add(mediator);

      this.add(mediator.refs);

      let junctions = []
      for (let referred of mediator.refs) {
        let junction = new Junction(mediator, referred)
        junctions.push(junction._id);
        this._add(junction);
      }
      this.junctions.set(mediator._id, junctions);
    }
  }

  /**
   * Adds one object to the Bucket.
   */
  _add(mediator) {
      var me = this;
      if (!(mediator instanceof Mediator)) {
        throw "Must be a subclass of Mediator";
      } else {
        me.memory.set(mediator._id, mediator);

        mediator.on("changed", function(mediator, oldData) {
          me.memory.set(mediator._id, mediator);
        })
      }
  }

  /**
   * Removes one or more objects from the Bucket.
   *
   * You can pass an id or an mediator or a list of both, mediators
   * and ids to this method.
   */
  remove(iter) {
    let mediators = iter[Symbol.iterator] !== undefined ? iter : [iter]
    for (var i in mediators) { this._remove(mediators[i]); }
  }

  /**
   * Removes one object from the bucket, either by id or mediator object.
   */
  _remove(mediator) {
    if (typeof mediator !== "string" && !(mediator instanceof Mediator)) {
      throw "Must be a subclass of Mediator or an id." + mediator;
    }
    let _id = (typeof mediator === "string") ? mediator : mediator._id;
    this.memory.delete(_id);
    let junctions = this.junctions.get(_id) || [];
    for (let juncId of junctions) {
      let junc = this.memory.get(juncId)
      this.remove([junc.to, juncId]);
    }
  }
}


/**
 * Those were managed behind the scene by a Bucket.
 * For each relation between two Mediators there
 * will be a Junction available.
 */
export class Junction extends Mediator {
  /**
   * Constructs the junction.
   *
   * @param {string|Mediator} from The parent of the Junction.
   * @param {string|Mediator} to The child of the Junction.
   */
  constructor(from, to) {
    from = (from instanceof Mediator) ? from._id : from;
    to = (to instanceof Mediator) ? to._id : to;
    super({
      model: 'junction',
      id: from + ':' + to,
      from: from,
      to: to
    })
  }
}
