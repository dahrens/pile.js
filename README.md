# pile.js

A distributed helper to set up a domain driven architecture
that can be shared between different environments.

## usage

pile.js aims to support the synchronization of objects.
Therefore it allows you to organize objects inside of buckets.
Those buckets may contain objects that inherit from Mediators.

```javascript

import {Mediator, Bucket, RedisBottom} from 'pilejs';

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

// create a bucket and add something
let bucket = new Bucket({
  'brain': Brain,
  'human': Human
}, RedisBottom)
bucket.add(foo);

// recreate
new Bucket({
  'brain': Brain,
  'human': Human
}).sync(function(recreated) {
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
