var get = Ember.get;

DS.DjangoRESTSerializer = DS.RESTSerializer.extend({
    patchInJSONRoot: function(json, type, many) {
        var pJSON, root;
        root = this.rootForType(type);
        if (many === true) {
            root = this.pluralize(root);
        }
        pJSON = {};
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
    }
});
