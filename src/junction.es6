'use strict';

import { Mediator } from './mediator';

/**
 * Those were managed behind the scene by a Bucket.
 * For each relation between two Mediators there
 * will be a Junction available.
 */
export class Junction extends Mediator {
  /**
   * Constructs the junction.
   *
   * @param {string|Mediator} from The parent of the Junction.
   * @param {string|Mediator} to The child of the Junction.
   */
  constructor(from, to) {
    from = (from instanceof Mediator) ? from._id : from;
    to = (to instanceof Mediator) ? to._id : to;
    super({
      model: 'junction',
      id: from + ':' + to,
      from,
      to
    });
  }
}
