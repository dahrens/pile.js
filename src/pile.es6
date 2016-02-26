'use strict';

import EventEmitter from 'events';
import { generate } from 'shortid';
import { Bucket } from './bucket';


/**
 * An Pile is a socket io namespace, that emits messages around.
 */
export class Pile extends EventEmitter {

  /**
   * A Pile gets constructed with a namespace string and a http server running
   * socket.io. The pile creates it own namespace on the server and starts
   * listening for clients.
   *
   * A Pile itself is not persistent - it relies on data in known buckets.
   */
  constructor(nsp, server) {
    super();
    this.nsp = server.of(nsp);
    let buckets = new Map();

    this.nsp.on('connection', function (socket) {
      buckets.set(socket.id, socket);
      socket.on('disconnect', function () {
        buckets.delete(socket.id);
      });
      socket.emit('hi', {nsp, buckets: buckets.keys()});
    });
    this.buckets = buckets;
  }
}
