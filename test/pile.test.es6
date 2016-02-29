'use strict';

import { should, assert } from 'chai';
should();
import {default as io} from 'socket.io';
import io_client from 'socket.io-client';

import { Pile } from 'src/pile';
import { Human, Brain } from 'test/lib/config';

const PORT = 1337;


describe('Pile', function() {
  var server, nsp, pile;
  before(function() {
    nsp = 'mocha';
    server = io.listen(PORT);
    pile = new Pile(nsp, server);
  });
  after(function() {
    server.close();
  });
  it('should create a namespace', function() {
    pile.should.have.property('nsp');
  });
  describe('#connect', function() {
    it('should allow you to connect to the nsp', function(done) {
      let client = io_client('ws://localhost:'+PORT+'/'+nsp);
      client.once('hi', function (res) {
        res.nsp.should.equal(nsp);
        res.should.have.property('jars');
        res.jars.should.have.length(1);
        client.disconnect();
        done();
      });
    });
  });
  describe('#disconnect', function() {
    it('should trigger disconnection on pile', function(done) {
      let client = io_client('ws://localhost:'+PORT+'/'+nsp);
      client.once('hi', function (res) {
        assert.equal(pile.clients.size, 1);
        client.once('disconnect', function() {
          // hacky but works... the pile needs a few ms...
          setTimeout(function() {
            assert.equal(pile.clients.size, 0);
            done();
          }, 20);
        });
        client.disconnect();
      });
    });
  })
});
