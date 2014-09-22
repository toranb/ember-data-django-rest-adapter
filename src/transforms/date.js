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
      year = date.getFullYear();
      month = date.getMonth() + 1;  // getMonth is 0-indexed
      month = month < 10 ? '0' + month : month;
      day = date.getDate();
      return year + '-' + month + '-' + day;
    } else {
      return null;
    }
  }
});
