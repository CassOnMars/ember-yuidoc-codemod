import Ember from 'ember';

export default Ember.Component.extend({
  somebody: "I'm a String!",

  /**
  * @property once
  * @type {Boolean}
  */
  once: false,

  told: Ember.computed.not(once),

  me(the, world, is) {
    return true;
  },

  actions: {
    gonna() {
      this.set('roll', this.me());
    }
  }
});
