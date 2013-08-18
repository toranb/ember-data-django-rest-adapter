DS.DjangoRESTSerializer = DS.RESTSerializer.extend({
    init: function() {
        this._super();

        this.configure({
            pagination: 'pagination',
        });
    },

    patchInJSONRoot: function(json, type, many) {
        var pJSON, root, res,
            meta = this.configOption(type, 'meta');

        pJSON = {};
        root = this.rootForType(type);

        if (many === true) {
            root = this.pluralize(root);
        }

        if (json['results'] && json['results'].constructor.name === 'Array') {
            pJSON[root] = json['results'];

            // try to compute current, next and previous page number
            var page_match = new RegExp('page=([0-9]+)');
            var page_current = 1;
            var page_previous = false;
            if(res = page_match.exec(json['previous'])) {
                page_previous = parseInt(res[1], 10);
                page_current = page_previous + 1;
            }
            var page_next = false;
            if(res = page_match.exec(json['next'])) {
                page_next = parseInt(res[1], 10);
                page_current = page_next - 1;
            }

            // add a pagination object in metadata
            pJSON[meta] = {
                pagination: {
                    count: json['count'],
                    current: page_current,
                    previous: page_previous,
                    next: page_next,
                },
            };
        } else {
            pJSON[root] = json;
        }

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
