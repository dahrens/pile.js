"use strict";

import EventEmitter from 'events';
import { generate } from 'shortid';


/**
 * Clones an object with stringify to JSON and returning the parsed result.
 */
function clone(o) { return JSON.parse(JSON.stringify(o)) }


/**
 * Mediators know how to persist their data into JSON.
 *
 * They also fire events for Buckets to listen on changes.
 */
export class Mediator extends EventEmitter {
  /**
   * @data The initial data on construction
   * @properties Informations about properties with possible related objects
   */
  constructor(data, properties) {
    super();

    this.data = { id: generate(), model: 'default' }

    this.properties = new Map();
    for (var prop in properties) {
      this.properties.set(prop, properties[prop])
    }

    for (let prop in data) {
      let value = data[prop];
      if (this.properties.has(prop)) {
        let property = this.properties.get(value);
        if (property instanceof ForeignKeyProperty) {
          this.data[prop] = value._id;
          property.set(value);
        }
      } else {
        this.data[prop] = data[prop];
      }
    }

    var _id = this.data['model'] + ':' + this.data['id']
    Object.defineProperty(this, '_id', { writable: false, value: _id });

    for(let prop in this.data) {
      if (prop == 'id' || prop == 'model') {
        Object.defineProperty(this, prop,
          {
            writable: false,
            value: this.data[prop]
          });
      } else {
        Object.defineProperty(this, prop,
          {
            get: function() { return this._get(prop); },
            set: function(value) { this._set(prop, value); }
          });
      }
    }
  }

  load(prop, done) {
    var me = this;
    let property = me.properties.get(prop);
    if (!property.loaded) {
      this._bucket.get(me.data[prop], function(err, obj) {
        property.value = obj
        property.loaded = true
        me.properties.set(prop, property)
        done.call(me);
      })
    } else {
      done.call(me);
    }
  }

  /**
   * Getter method that is aware subobjects.
   */
  _get(prop) {
    if (this.properties.has(prop)) {
      let property = this.properties.get(prop);
      return property.value;
    } else {
      return this.data[prop]
    }
  }

  /**
   * Setter method for instance properties.
   */
  _set(prop, value) {
    if (this.properties.has(prop) && !value) {
      let property = this.properties.get(prop)
      property.value = value
      this.data[prop] = value;
    } else {
      if (this.data[prop] !== value) {
        var old = clone(this.data);
        this.data[prop] = value;
        this.emit('changed', this, old);
      }
    }
  }

  /**
   * Returns the underlying data object as json string.
   */
  toJSON() { return JSON.stringify(this.data); }
}


/**
 * Properties define special behaviours for data
 * that is bound to Mediators.
 */
export class Property extends EventEmitter {
  constructor() {
    super();
  }
}


/**
 * A Junction to another Mediator.
 */
export class ForeignKeyProperty extends Property {
  constructor() {
    super();
  }
}


/**
 * Many Junctions to other Mediators.
 */
export class ToManyProperty extends Property {
  constructor() {
    super();
  }
}
