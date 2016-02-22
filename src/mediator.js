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
 * @emits 'changed' with (mediatorObj, eventData={prop: 'thePropName', old: oldValue})
 */
export class Mediator extends EventEmitter {
  /**
   * Mediators eat a data Object on construction.
   *
   * @param {data} Object The data for construction
   */
  constructor(data) {
    super();

    this._data = { id: generate(), model: 'default' };
    this._refs = new Map();

    for (let prop in data) {
      let value = data[prop];
      if (value instanceof Mediator) {
        this._data[prop] = value._id;
        this._refs.set(value._id, value);
      } else {
        this._data[prop] = data[prop];
      }
    }

    Object.defineProperty(this, 'refs', {
      get: function() { return this._refs.values(); }
    })

    for(let prop in this._data) {
      Object.defineProperty(this, prop,
        {
          get: function() { return this._get(prop); },
          set: function(value) { this._set(prop, value); }
        });
    }
  }

  get _id() { return this._data['model'] + ':' + this._data['id'] }

  /**
   * Getter method that is aware references.
   *
   * @param {string} prop The name of the property
   * @returns {mixed} The value of the property.
   */
  _get(prop) {
    let value = this._data[prop];
    if (this._refs.has(value)) {
      return this._refs.get(value);
    }
    else { return value; }
  }

  /**
   * Setter method for instance properties that are encapsulated in _data.
   * The setter tracks references in the seperate map _refs.
   *
   * @param   {string} prop The name of the property to set.
   * @param   {mixed} value The new value for the given prop.
   * @emits   'changed' with
   *          (mediatorObj, eventData={prop: 'thePropName', old: oldValue})
   */
  _set(prop, value) {
    let cur;
    if (value instanceof Mediator) {
      cur = this._refs.get(this._data[prop]);
      if (cur) { this._refs.delete(this._data[prop]); }
      this._refs.set(value._id, value);
      this._data[prop] = value._id
    } else {
      cur = this._data[prop]
      this._data[prop] = value
    }
    this.emit('changed', this, {prop: prop, old: cur});
  }

  /**
   * Returns the underlying data object as json string.
   *
   * @returns {string} This object as a JSON string.
   */
  toJSON() { return JSON.stringify(this._data); }
}
