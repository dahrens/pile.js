'use strict';

import { should } from 'chai';
should();
import * as http from 'http';
import {default as io} from 'socket.io';

import { Pile } from 'src/pile';
import { Human, Brain } from 'test/lib/config';

const PORT = 1337;


describe('Pile', function() {
  var server, pile;
  before(function() {
    let app = http.createServer();
    server = io(app);
    app.listen(PORT);
  });
  it('should create a namespace', function() {
    // var nsp = io.of('/my-namespace');
    // nsp.on('connection', function(socket){
    //   console.log('someone connected'):
    // });
    // nsp.emit('hi', 'everyone!');
  });
  describe('#connect', function() {
    it('should allow you to connect to the nsp', function() {
      server.on('connection', function(socket) {
        socket.on('disconnect', function() { });
      });
    });
  });
});
