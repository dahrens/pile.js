"use strict";

import { createClient } from 'redis';
import EventEmitter from 'events';

import { Mediator } from 'src/mediator';
import { flatten } from 'src/bucket';




/**
 * Base class for Bottoms. We need this atm to test for Bottom class or instance
 */
export class Bottom extends EventEmitter { }


/**
 * Persists objects into redis.
 */
export class RedisBottom extends Bottom {

  /**
   * Constructs a new RedisBottom.
   *
   * @param {namespace} string The namespace used as prefix for redis.
   */
  constructor(namespace="unknown") {
    super();
    /**
     * The prefix used for all keys.
     */
    this.namespace = namespace;
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
    }
  }

  /**
   * Read everything that is known by this bottom and tell when done().
   *
   * @param {Function} done Gets called with all the models.
   */
  read(done) {
    var me = this;
    this.client.keys(this.namespace + '*', function(err, keys) {
      let async = require("async");
      let models = new Map();
      async.each(keys, function(key, cb) {
        let [namespace, model] = key.split(':');
        let id = key.replace(namespace + ':', '')
        me.client.hgetall(id, function(err, data) {
            models.set(id, data);
          cb();
        });
      }, function() {
        done(models);
      });
    });
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
