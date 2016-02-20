"use strict";

import { Mediator } from 'src/mediator';
import { flatten } from 'src/bucket';

/**
 * Excatly what you expect: persist your json with redis.
 */
export class RedisBottom {

  constructor(client) {
    this.client = client
  }

  ground(mediator) {
    let ret = [mediator._id]
    for (var prop in mediator._data) {
      ret.push(prop, mediator._data[prop]);
    }
    return ret
  }


  write(mediators) {
    mediators = Array.isArray(mediators) ? mediators : [mediators]
    for (var i = 0; i < mediators.length; i++) {
      this.client.hmset(this.ground(mediators[i]));
    }
  }

  read(id) {

  }

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
