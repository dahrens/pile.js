"use strict";

import EventEmitter from 'events';
import { generate } from 'shortid';
import { Mediator } from './mediator';
import { Bottom } from './bottom';


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
      this.models['junction'] = Junction;
      /**
       * @type {Object} An Map with mediator._id => [list of junction _ids]
       */
      this.junctions = new Map();
      /**
       * @type {Map}
       */
      this.subscribers = new Map();
      /**
       * @type {Object} A Bottom used for persisting objects somewhere.
       */
      this.bottom = bottom;
      if (bottom !== undefined && !(bottom instanceof Bottom)) {
        this.bottom = new bottom(this.namespace);
      }
  }

  /**
   * Synchronizes the Bucket with its Bottom. This is called after creation
   * of a Bucket, that has a valid bottom.
   *
   * @param {function} done The callback that gets an copy of the bottoms memory
   */
  sync(done) {
    let me = this;
    this.bottom.read(function(content) {
      let junctions = [];

      for (let [id, data] of content.entries()) {
        let obj = me.restore(id, data)
        if (id.startsWith('junction:')) {
          junctions.push(obj);
        }
        me.memory.set(id, obj);
      }

      for (let junction of junctions) {
        let from = me.memory.get(junction.from);
        for (let prop in from._data) {
          if (from[prop] === junction.to) {
            from._refs.set(junction.to, me.memory.get(junction.to));
            me.memory.set(junction._id, junction);
          }
        }
      }
      done(me)
    });
  }

  /**
   * Restores an object that was persistet back, by setting _data object
   * insode of a fresh instance.
   *
   * @param {string} _id The id of the object.
   * @param {Object} raw_data The plain data that comes from a bottom.
   */
  restore(_id, raw_data) {
    let modelName = _id.split(':')[0];
    if (!modelName) {
        throw "No known modelName found in _id: " + _id;
    }
    let model = new this.models[modelName];
    for (let prop in raw_data) {
      model._data[prop] = raw_data[prop];
    }
    return model;
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

  /**
   * Subscribing this bucket, means getting notified of all changes made here.
   * The subscribing bucket will automatically include all models saved in this
   * Bucket.
   *
   * @param {Bucket} bucket The bucket that will be notified on all changes.
   */
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
  get(_id) {
      if (typeof _id !== "string") {
        throw "Must be a string"
      }
      return this.memory.get(_id);
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
   * Removes one mediator from the bucket by its _id.
   *
   * @emits 'remove'
   */
  _remove(_id) {
    this.memory.delete(_id);
    if (this.bottom) { this.bottom.delete(_id) }
    this.emit('remove', _id);
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
