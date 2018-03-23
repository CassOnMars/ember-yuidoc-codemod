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
  * @return {Boolean}
  */
  me() {
    console.log("the world is");
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
