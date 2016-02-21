"use strict";

import { createClient } from 'redis';
import EventEmitter from 'events';

import { Mediator } from 'src/mediator';
import { flatten } from 'src/bucket';


/**
 * Appends a 's' to the given string.
 */
function pluralize(s) { return s + 's'; }

/**
 * Persists objects into redis.
 */
export class RedisBottom extends EventEmitter {

  /**
   * Constructs a new RedisBottom.
   *
   * @param {namespace} string The namespace used as prefix for redis.
   */
  constructor(namespace="unknown") {
    super();
    /**
     * @type {RedisClient} node_redis based client to talk to redis.
     */
    this.client = createClient({prefix: namespace + ":"})
  }

  /**
   * Converts the given mediator into a hashmap for redis.
   */
  ground(mediator) {
    let ret = [mediator._id]
    for (var prop in mediator._data) {
      ret.push(prop, mediator._data[prop]);
    }
    return ret
  }

  /**
   * Writes the given mediators into redis backend.
   */
  write(mediators) {
    mediators = Array.isArray(mediators) ? mediators : [mediators]
    for (let mediator of mediators) {
      this.client.hmset(this.ground(mediator));
      let setName = pluralize(mediator.model);
      this.client.sadd(setName, mediator.id);
    }
  }

  /**
   * Read everything that is known by this bottom.
   */
  read() {

  }

  readModelSet(setName) {
    let me = this;
    this.client.smembers(setName, function(err, reply) {
      if (err) { throw err }
      me.emit('models', reply)
    })
  }

  /**
   * Deletes data from the redis backend.
   */
  delete() {

  }
}


/**
 * Excatly what you expect: persist your json in html5 LocalStorage.
 */
// export class LocalStorageBottom {
//   constructor() {
//
//   }
// }
