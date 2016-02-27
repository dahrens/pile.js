# pile.js

[![Build Status](https://travis-ci.org/dahrens/pile.js.svg?branch=master)](https://travis-ci.org/dahrens/pile.js)
[![Coverage Status](https://coveralls.io/repos/github/dahrens/pile.js/badge.svg?branch=master)](https://coveralls.io/github/dahrens/pile.js?branch=master)

A distributed helper to set up a domain driven architecture
that can be shared between different environments.

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

// recreate
new Bucket("humans", models, RedisBottom).sync(function(recreated) {
  // recreated bottoms with the same name contain everything from storage.
  assert.equal(recreated.get(foo._id), foo);
})

```

## contribute

```
git clone https://github.com/dahrens/pile.js.git
cd pile.js
npm i
```

### develop

```
grunt develop
```
