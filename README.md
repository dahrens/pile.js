# pile.js

[![Build Status](https://travis-ci.org/dahrens/pile.js.svg?branch=master)](https://travis-ci.org/dahrens/pile.js)
[![Coverage Status](https://coveralls.io/repos/github/dahrens/pile.js/badge.svg?branch=master)](https://coveralls.io/github/dahrens/pile.js?branch=master)

A distributed helper to set up a domain driven architecture
that can be shared between different environments.

**NOTE: Currently this package is under development and not really usable.**

## usage

pile.js aims to support the synchronization of objects.
Therefore it allows you to organize objects inside of buckets.
Those buckets may contain objects that inherit from Mediators.

```javascript

import {Mediator, Bucket, RedisBottom} from 'pile.js';

// define a class with reference to another class.
class Human extends Mediator {
  constructor(name='foobar', brain=null) {
    super({
      model: 'human',
      name: name,
      brain: brain
    });
  }
  say(sentence) { return format('Human %s says: "%s"', this.name, sentence); }
}

// define the subclass
class Brain extends Mediator {
  constructor() { super({ model: 'brain' }) }
  think() { return format('ARGH!') }
}

// create an object
let foo = new Human("foo", new Brain());
let models = {
  'brain': Brain,
  'human': Human
}

// in memory *only* bucket without persistence.
let mirror = new Bucket("mirror", models)

// create a persistent bucket
let bucket = new Bucket("humans", models, RedisBottom)

// subscribe with the mirror
bucket.subscribe(mirror);

// add some data
bucket.add(foo);

// the mirror contains our foo.
assert.equal(mirror.get(foo._id), foo);

```

## development

You need nodejs 5.x and a running redis server. For running tasks grunt is used.

```bash
npm i
grunt dev  # starts a watch task for eslint, babel, mocha and esdoc
```

### Using vagrant

```bash
vagrant up
vagrant ssh
cd /vagrant
grunt dev
# open another terminal on the host machine
vagrant rsync-auto
```

* debian/jessie64 relies on rsync instead of shared folders, use `vagrant rsync` and `vagrant rsync-auto` - this also helps to avoid problems with symlinks made by npm.
* git can't be used inside of the box, as .git is not synced.
* The box is provisioned using salt.
 * Have a look at `.saltstack` for provisioning.
 * Run `sudo salt-call state.highstate` inside of the box if something went wrong and you want to see whats going on.
