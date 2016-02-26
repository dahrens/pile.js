'use strict';

import EventEmitter from 'events';
import { Mediator } from './mediator';
import { Junction } from './junction';
import { Bottom } from './bottom';


/**
 * Buckets are used to create your overall pile.
 * Use them to cluster your objects together.
 *
 * Buckets store data in a flat manner.
 */
export class Bucket extends Mediator {
  /**
   * Create a new Bucket, that can store different subclasses
   * of Mediator.
   */
  constructor() {
    super({
      model: 'bucket',
      items: []
    });
      /**
       * @type {Map} The inmemory store for the bucket.
       */
    this.memory = new Map();
      /**
       * @type {Object} An Map with mediator._id => [list of junction _ids]
       */
    this.junctions = new Map();
      /**
       * @type {Map}
       */
    this.subscribers = new Map();
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
    if (typeof _id !== 'string') {
      throw 'Must be a string';
    }
    return this.memory.get(_id);
  }

  /**
   * Adds one or more mediators to the Bucket.
   */
  add(iter) {
    let mediators = iter[Symbol.iterator] !== undefined ? iter : [iter];
    for (let mediator of mediators) {

      if (!(mediator instanceof Mediator)) {
        throw 'Must be a subclass of Mediator';
      }

      this._add(mediator);

      this.add(mediator.refs);

      let junctions = [];
      for (let referred of mediator.refs) {
        let junction = new Junction(mediator, referred);
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
    this.items.push(mediator._id);
    this.emit('add', mediator);
  }

  /**
   * Removes one or more objects from the Bucket.
   *
   * You can pass an id or an mediator or a list of both, mediators
   * and ids to this method.
   */
  remove(iter) {
    let mediators = iter[Symbol.iterator] !== undefined ? iter : [iter];
    for (let mediator of mediators) {
      if (typeof mediator !== 'string' && !(mediator instanceof Mediator)) {
        throw 'Must be a subclass of Mediator or an id.' + mediator;
      }
      let _id = (typeof mediator === 'string') ? mediator : mediator._id;
      this._remove(_id);
      let junctions = this.junctions.get(_id) || [];
      for (let juncId of junctions) {
        let junc = this.memory.get(juncId);
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
    this.emit('remove', _id);
  }
}
