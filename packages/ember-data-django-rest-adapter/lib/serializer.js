DS.DjangoRESTSerializer = DS.RESTSerializer.extend({
    patchInJSONRoot: function(json, type, many) {
        var pJSON, root;

        pJSON = {};
        root = this.rootForType(type);

        if (many === true) {
            root = this.pluralize(root);
        }

        pJSON[root] = json;

        return pJSON;
    },

    keyForHasMany: function(type, name) {
        return this.keyForAttributeName(type, name);
    },

    keyForBelongsTo: function(type, name) {
        return this.keyForAttributeName(type, name);
    },

    extract: function(loader, json, type, records) {
        json = this.patchInJSONRoot(json, type, false);
        this._super(loader, json, type, records);
    },

    extractMany: function(loader, json, type, records) {
        json = this.patchInJSONRoot(json, type, true);
        this._super(loader, json, type, records);
    },

    // modified version of https://github.com/emberjs/data/blob/master/packages/ember-data/lib/serializers/json_serializer.js#L169
    // Django Rest Framework expects a non-embedded has-many to serialize to an
    // array of ids, but the JSONSeriarlizer assumed non-embedded relationship 
    // updates would happen in the related model. 
    addHasMany: function(hash, record, key, relationship) {
      var type = record.constructor,
        name = relationship.key,
        serializedHasMany = [],
        includeType = (relationship.options && relationship.options.polymorphic),
        manyArray, embeddedType;

      // Get the DS.ManyArray for the relationship off the record
      // manyArray = get(record, name);
      manyArray = record.get(name);

      // If the has-many is not embedded, send just the array of ids.
      embeddedType = this.embeddedType(type, name);
      if (embeddedType !== 'always') {
        // Build up the array of ids
        manyArray.forEach(function (record) {
          serializedHasMany.push(this.serializeId(record.id));
        }, this);
      } else {
        // Build up the array of serialized records
        manyArray.forEach(function (record) {
          serializedHasMany.push(this.serialize(record, { includeId: true, includeType: includeType }));
        }, this);
      }

      // Set the appropriate property of the serialized JSON to the
      // array of serialized embedded records or array of ids
      hash[key] = serializedHasMany;
    }
});
