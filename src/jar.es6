'use strict';

import EventEmitter from 'events';
import { Mediator } from './mediator';
import { Junction } from './junction';
import { Bucket } from './bucket';
import { Bottom } from './bottom';


/**
 * Buckets are used to create your overall pile.
 * Use them to cluster your objects together.
 *
 * Buckets store data in a flat manner.
 */
export class Jar extends Bucket {
  /**
   * Create a new Bucket, that can store different subclasses
   * of Mediator.
   */
  constructor(namespace='default', models={}, bottom) {
    super();
      /**
       * @type {string} The namespace of the bucket. Used to prefix IDs.
       */
    this.namespace = namespace;
      /**
       * @type {Object} An object with keys for models and classes as value.
       */
    this.models = models;
    this.models['junction'] = Junction;
      /**
       * @type {Object} A Bottom used for persisting objects somewhere.
       */
    this.bottom = (bottom instanceof Bottom) ? bottom : new bottom(this.namespace);
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
      throw 'Must be a subclass of Mediator';
    }
    this.models[instance.model] = cls;
  }

  /**
   * Unregister a class from this Bucket.
   *
   * @param {Mediator} cls The class that should be unregistered.
   */
  unregister(cls) {
    throw 'to be done...';
  }

  /**
   * Synchronizes the Bucket with its Bottom. This is called after creation
   * of a Bucket, that has a valid bottom.
   *
   * @param {function} done The callback that gets an copy of the bottoms memory
   */
  sync(done) {
    let me = this;
    this.bottom.read(function (content) {
      let junctions = [];

      for (let [id, data] of content.entries()) {
        let obj = me.restore(id, data);
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
      done(me);
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
    let [modelName, modelId] = _id.split(':');
    if (!modelName || !modelId) {
      throw 'No known modelName found in _id: ' + _id;
    }
    let model = new this.models[modelName];
    for (let prop in raw_data) {
      model._data[prop] = raw_data[prop];
    }
    return model;
  }

  _add(mediator) {
    super._add(mediator);
    if (!this.models.hasOwnProperty(mediator.model)) {
      console.warn('You have added the model ' + mediator.model + ' to a jar,' +
      'that does not know about the class. Reconstruction will fail.');
    }
    this.bottom.write(mediator);
  }

  _remove(_id) {
    super._remove(_id);
    if (this.bottom) { this.bottom.delete(_id); }
  }

}
