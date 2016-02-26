'use strict';

import { should } from 'chai';
should();
import {default as io} from 'socket.io';
import io_client from 'socket.io-client';

import { Pile } from 'src/pile';
import { Human, Brain } from 'test/lib/config';

const PORT = 1337;


describe('Pile', function() {
  var nsp, pile;
  before(function() {
    nsp = 'mocha';
    let server = io.listen(PORT);
    pile = new Pile(nsp, server);
  });
  it('should create a namespace', function() {
    pile.should.have.property('nsp');
  });
  describe('#connect', function() {
    it('should allow you to connect to the nsp', function(done) {
      let client = io_client('ws://localhost:'+PORT+'/'+nsp);
      client.once('hi', function (res) {
        console.log(res);
        res.nsp.should.equal(nsp);
        res.should.have.property('jars');
        res.jars.should.have.length(1);
        done()
      });
    });
  });
});
