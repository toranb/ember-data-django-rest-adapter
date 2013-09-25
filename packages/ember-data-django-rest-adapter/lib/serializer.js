var get = Ember.get, set = Ember.set, isNone = Ember.isNone;

DS.DjangoRESTSerializer = DS.RESTSerializer.extend({

    init: function() {
        this._super.apply(this, arguments);
    },

    extractDjangoPayload: function(store, type, payload) {
        for (var item in payload) {
            if (!Ember.isNone(payload[item]) && typeof(payload[item][0]) !== 'number') {
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
        // using normalize from RESTSerializer applies transforms and allows
        // us to define keyForAttribute and keyForRelationship to handle
        // camelization correctly. 
        this.normalize(type, payload);
        this.extractDjangoPayload(store, type, payload);
        return payload;
    },

    extractArray: function(store, type, payload) {
        var self = this;
        for (var j = 0; j < payload.length; j++) {
            // using normalize from RESTSerializer applies transforms and allows
            // us to define keyForAttribute and keyForRelationship to handle
            // camelization correctly.
            this.normalize(type, payload[j]);
            self.extractDjangoPayload(store, type, payload[j]);
        }
        return payload;
    },

    /**
      Converts camelcased attributes to underscored when serializing.

      Stolen from DS.ActiveModelSerializer.

      @method keyForAttribute
      @param {String} attribute
      @returns String
    */
    keyForAttribute: function(attr) {
        return Ember.String.decamelize(attr);
    },

    /**
      Underscores relationship names when serializing relationship keys.
  
      Stolen from DS.ActiveModelSerializer.
      
      @method keyForRelationship
      @param {String} key
      @param {String} kind
      @returns String
    */
    keyForRelationship: function(key, kind) {
        return Ember.String.decamelize(key);
    }

});
