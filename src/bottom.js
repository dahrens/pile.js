"use strict";

import { Mediator } from 'src/mediator';
import { flatten } from 'src/bucket';

/**
 * Persists objects into redis.
 */
export class RedisBottom {

  /**
   * Constructs a new RedisBottom.
   *
   * @param {redisClient} client The underlying redis client that will be used.
   */
  constructor(client) {
    this.client = client
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
    for (var i = 0; i < mediators.length; i++) {
      this.client.hmset(this.ground(mediators[i]));
    }
  }

  /**
   * Reads data from redis backend.
   */
  read(id) {

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
