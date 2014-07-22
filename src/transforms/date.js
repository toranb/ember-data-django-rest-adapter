DS.DjangoDateTransform = DS.Transform.extend({
  deserialize: function(serialized) {
    if (typeof serialized === 'string') {
      return new Date(Ember.Date.parse(serialized));
    } else if (typeof serialized === 'number') {
      return new Date(serialized);
    } else if (Ember.isEmpty(serialized)) {
      return serialized;
    } else {
      return null;
    }
  },
  serialize: function(date) {
    if (date instanceof Date && date.toString() !== 'Invalid Date') {
      return date.toISOString().slice(0, 10);
    } else {
      return null;
    }
  }
});
