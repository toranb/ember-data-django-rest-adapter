var get = Ember.get, set = Ember.set, isNone = Ember.isNone;

DS.DjangoRESTSerializer = DS.JSONSerializer.extend({

    init: function() {
        this._super.apply(this, arguments);
    },

    extractDjangoPayload: function(store, type, payload) {
        for (var item in payload) {
            if (typeof(payload[item][0]) !== 'number') {
                if (payload[item].constructor.name === 'Array') {
                    var singular_type = Ember.String.singularize(item);
                    /*jshint loopfunc:true*/
                    var ids = payload[item].map(function(related) {
                        store.push(singular_type, related);
                        return related.id; //todo find pk (not always id)
                    });
                    payload[item] = ids;
                }
            }
        }
    },

    extractSingle: function(store, type, payload) {
        this.extractDjangoPayload(store, type, payload);
        return payload;
    },

    extractArray: function(store, type, payload) {
        var self = this;
        for (var j = 0; j < payload.length; j++) {
            self.extractDjangoPayload(store, type, payload[j]);
        }
        return payload;
    }

});
