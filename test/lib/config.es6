"use strict";

import { format } from 'util';
import { Mediator } from 'src/mediator';


export class Human extends Mediator {

  constructor(name='foobar', brain=null) {
    super({
      model: 'human',
      name: name,
      brain: brain
    });
  }

  say(sentence) {
    return format('Human %s says: "%s"', this.name, sentence);
  }
}

export class Brain extends Mediator {
  constructor() {
    super({ model: 'brain' })
  }
  think() {
    return format('ARGH!')
  }
}
