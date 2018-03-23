import Ember from 'ember';

/**
* @module components
* @extends Ember.Component
* @class Doctest
*/
export default Ember.Component.extend({
  /**
  * @property somebody
  * @type {String}
  */
  somebody: "I'm a String!",

  /**
  * @property once
  * @type {Boolean}
  */
  once: false,

  /**
  * @property told
  * @readOnly
  * @type {Boolean}
  */
  told: Ember.computed.not(once),

  /**
  * @method me
  * @param {Object} the
  * @param {Object} world
  * @param {Object} is
  * @return {Boolean}
  */
  me(the, world, is) {
    return true;
  },

  actions: {
    /**
    * @method gonna
    */
    gonna() {
      this.set('roll', this.me());
    }
  }
});
