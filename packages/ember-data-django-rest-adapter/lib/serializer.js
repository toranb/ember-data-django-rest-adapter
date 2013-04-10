(function() {
    var get = Ember.get;

    DS.DjangoRESTSerializer = DS.RESTSerializer.extend({

        keyForHasMany: function(type, name) {
            return this.keyForAttributeName(type, name);
        },

        keyForBelongsTo: function(type, name) {
            return this.keyForAttributeName(type, name);
        },

        addBelongsTo: function(hash, record, key, relationship) {
            var id = get(record, relationship.key+'.id');

            if (!Ember.isNone(id)) {
                hash[key] = id;
                //provide the adapter with parent information for the create
                record['parent_key'] = relationship.key;
                record['parent_value'] = id;
            }
        }
    });

})();
