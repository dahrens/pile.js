"use strict";

import EventEmitter from 'events';
import { generate } from 'shortid';
import { Mediator } from 'src/mediator';


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
  constructor(namespace='default', models={}, bottom) {
      super();
      /**
       *
       */
      this.namespace = namespace || generate();
      /**
       * @type {Map} The inmemory store for the bucket.
       */
      this.memory = new Map();
      /**
       * @type {Object} An object with keys for models and classes as value.
       */
      this.models = models;
      /**
       * @type {Object} An Map with mediator._id => [list of junction _ids]
       */
      this.junctions = new Map();
      /**
       * @type {Object} A Bottom used for persisting objects somewhere.
       */
      this.bottom = (bottom === undefined) ? bottom : new bottom(namespace);
      /**
       * @type {Map}
       */
      this.subscribers = new Map();
  }

  /**
   * Synchronizes the Bucket with its Bottom. This is called after creation
   * of a Bucket, that has a
   */
  sync() {

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

  subscribe(bucket) {
    this.on('add', mediator => bucket.add(mediator));
    this.on('remove', mediatorId => bucket.remove(mediatorId));
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

      if (!(mediator instanceof Mediator)) {
        throw "Must be a subclass of Mediator";
      }

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
   * Adds one mediator to the Bucket.
   *
   * @emits 'add'
   */
  _add(mediator) {
      this.memory.set(mediator._id, mediator);
      if (this.bottom) {
        if (!this.models.hasOwnProperty(mediator.model)) {
          console.warn("You have added the model " + mediator.model + " to persistent bucket, that does not know about the class. Reconstruction from Bottom will fail.");
        }
        this.bottom.write(mediator);
      }

      var me = this;
      mediator.on("changed", function(mediator, oldData) {
        me.memory.set(mediator._id, mediator);
      });

      this.emit('add', mediator);
  }

  /**
   * Removes one or more objects from the Bucket.
   *
   * You can pass an id or an mediator or a list of both, mediators
   * and ids to this method.
   */
  remove(iter) {
    let mediators = iter[Symbol.iterator] !== undefined ? iter : [iter]
    for (let mediator of mediators) {
      if (typeof mediator !== "string" && !(mediator instanceof Mediator)) {
        throw "Must be a subclass of Mediator or an id." + mediator;
      }
      let _id = (typeof mediator === "string") ? mediator : mediator._id;
      this._remove(_id);
      let junctions = this.junctions.get(_id) || [];
      for (let juncId of junctions) {
        let junc = this.memory.get(juncId)
        this.remove([junc.to, juncId]);
      }
    }
  }

  /**
   * Removes one mediator by its _id from the bucket.
   *
   * @emits 'remove'
   */
  _remove(_id) {
    this.memory.delete(_id);
    if (this.bottom) { this.bottom.delete(_id) }
    this.emit('remove', _id);
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
}


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
