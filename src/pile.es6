'use strict';

import EventEmitter from 'events';
import { Jar } from './jar';
import { RedisBottom } from './bottom';


/**
 * An Pile is a socket io namespace, that emits messages around.
 */
export class Pile extends EventEmitter {

  /**
   * A Pile gets constructed with a namespace string and a http server running
   * socket.io. The pile creates it own namespace on the server and starts
   * listening for clients.
   *
   * A Pile itself is not persistent - it relies on data in known jars.
   */
  constructor(nsp, server) {
    super();
    this.nsp = server.of(nsp);

    let jars = new Map();
    jars.set('default', new Jar(nsp, {}, RedisBottom));

    let clients = new Map();

    this.nsp.on('connection', function (socket) {
      clients.set(socket.id, socket);
      socket.on('disconnect', function () {
        clients.delete(socket.id);
      });
      socket.emit('hi', {nsp, jars: Array.from(jars.keys())});
    });
    this.clients = clients;
    this.jars = jars;
  }
}
