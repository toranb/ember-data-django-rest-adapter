// modified from https://github.com/emberjs/data/blob/master/packages/ember-data/lib/transforms/date.js
// formatted for isodate format.
// deserialize was left alone, serialize was modified
// also, see: https://github.com/toranb/ember-data-django-rest-adapter/issues/26
// WARNING! Requires Date.toJSON() to exist (natively or with shim)
DS.IsodateTransform = DS.Transform.extend({
  deserialize: function(serialized) {
    var type = typeof serialized;
 
    if (type === "string") {
      return new Date(Ember.Date.parse(serialized));
    } else if (type === "number") {
      return new Date(serialized);
    } else if (serialized === null || serialized === undefined) {
      // if the value is not present in the data,
      // return undefined, not null.
      return serialized;
    } else {
      return null;
    }
  },
 
  serialize: function(date) {
    if (date instanceof Date) {
      return date.toJSON();
    } else {
      return null;
    }
  }
});