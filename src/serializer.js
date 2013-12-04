DS.DjangoRESTSerializer = DS.RESTSerializer.extend({

    init: function() {
        this._super.apply(this, arguments);
    },

    extractDjangoPayload: function(store, type, payload) {
        type.eachRelationship(function(key, relationship){
            if (!Ember.isNone(payload[key]) &&
                typeof(payload[key][0]) !== 'number' &&
                typeof(payload[key][0]) !== 'string' &&
                relationship.kind ==='hasMany') {
              if (Ember.typeOf(payload[key]) === 'array' && payload[key].length > 0) {
                var ids = payload[key].mapBy('id'); //todo find pk (not always id)
                this.pushArrayPayload(store, relationship.type, payload[key]);
                payload[key] = ids;
              }
            }
            else if (!Ember.isNone(payload[key]) && typeof(payload[key]) === 'object' && relationship.kind ==='belongsTo') {
                var id=payload[key].id;
                this.pushSinglePayload(store,relationship.type,payload[key]);
                payload[key]=id;
            }
        }, this);
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
      This method allows you to push a single object payload.

      It will first normalize the payload, so you can use this to push
      in data streaming in from your server structured the same way
      that fetches and saves are structured.

      @param {DS.Store} store
      @param {String} type
      @param {Object} payload
    */
    pushSinglePayload: function(store, type, payload) {
        type = store.modelFor(type);
        payload = this.extract(store, type, payload, null, "find");
        store.push(type, payload);
    },

    /**
      This method allows you to push an array of object payloads.

      It will first normalize the payload, so you can use this to push
      in data streaming in from your server structured the same way
      that fetches and saves are structured.

      @param {DS.Store} store
      @param {String} type
      @param {Object} payload
    */
    pushArrayPayload: function(store, type, payload) {
        type = store.modelFor(type);
        payload = this.extract(store, type, payload, null, "findAll");
        store.pushMany(type, payload);
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
    },

    /**
      Underscore relationship names when serializing belongsToRelationships

      @method serializeBelongsTo
    */
    serializeBelongsTo: function(record, json, relationship) {
        var key = relationship.key;
        var belongsTo = record.get(key);
        var json_key = this.keyForRelationship ? this.keyForRelationship(key, "belongsTo") : key;

        if (Ember.isNone(belongsTo)) {
          json[json_key] = belongsTo;
        } else {
          if (typeof(record.get(key)) === 'string') {
            json[json_key] = record.get(key);
          }else{
            json[json_key] = record.get(key).get('id');
          }
        }

        if (relationship.options.polymorphic) {
          this.serializePolymorphicType(record, json, relationship);
        }
    },

    /**
      Underscore relationship names when serializing hasManyRelationships

      @method serializeHasMany
    */
    serializeHasMany: function(record, json, relationship) {
        var key = relationship.key,
            json_key = this.keyForRelationship(key, "hasMany"),
            relationshipType = DS.RelationshipChange.determineRelationshipType(
                record.constructor, relationship);

        if (relationshipType === 'manyToNone' ||
            relationshipType === 'manyToMany')
            json[json_key] = record.get(key).mapBy('id');
    }

});
