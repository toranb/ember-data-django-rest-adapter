function rejectionHandler(reason) {
    Ember.Logger.error(reason, reason.message);
    throw reason;
}

var get = Ember.get, set = Ember.set;

DS.DjangoRESTAdapter = DS.RESTAdapter.extend({
    bulkCommit: false,
    serializer: DS.DjangoRESTSerializer,

    createRecord: function(store, type, record) {
        var root, adapter, data;

        root = this.rootForType(type);
        adapter = this;
        data = this.serialize(record);

        return this.ajax(this.buildURL(root), "POST", {
            data: data
        }).then(function(json){
            adapter.didCreateRecord(store, type, record, json);
        }, function(xhr) {
            adapter.didError(store, type, record, xhr);
            throw xhr;
        }).then(null, rejectionHandler);
    },

    updateRecord: function(store, type, record) {
        var id, root, adapter, data;

        id = get(record, 'id');
        root = this.rootForType(type);
        adapter = this;
        data = this.serialize(record);

        return this.ajax(this.buildURL(root, id), "PUT", {
            data: data
        }).then(function(json){
            adapter.didUpdateRecord(store, type, record, json);
        }, function(xhr) {
            adapter.didError(store, type, record, xhr);
            throw xhr;
        }).then(null, rejectionHandler);
    },

    findMany: function(store, type, ids, parent) {
        var adapter, root, url;
        adapter = this;

        if (parent) {
            url = this.buildFindManyUrlWithParent(type, parent);
        } else {
            root = this.rootForType(type);
            url = this.buildURL(root);
        }

        return this.ajax(url, "GET", {
        }).then(function(json) {
          adapter.didFindMany(store, type, json);
        }).then(null, rejectionHandler);
    },

    ajax: function(url, type, hash) {
      hash = hash || {};
      hash.cache = false;
      return this._super(url, type, hash);
    },

    buildURL: function(record, suffix) {
        var url = this._super(record, suffix);
        if (url.charAt(url.length -1) !== '/') {
            url += '/';
        }
        return url;
    },

    buildFindManyUrlWithParent: function(type, parent) {
        var root, url, endpoint, parentType, parentValue;

        endpoint = parent.get('findManyKey');
        parentType = parent.get('findManyType');
        if (typeof endpoint !== 'string') {
            parent.eachRelationship(function(name, relationship) {
                if (relationship.kind === 'hasMany' && relationship.type === type) {
                    endpoint = relationship.key;
                    parentType = relationship.parentType;
                }
            });
        }
        
        Ember.assert("could not find a relationship for the specified child type", typeof endpoint !== "undefined");

        endpoint = this.serializer.keyForAttributeName(parentType, endpoint);
        parentValue = parent.get('id');
        root = this.rootForType(parentType);
        url = this.buildURL(root, parentValue);

        return url + endpoint + '/';
    },

    /**
      RESTAdapter expects HTTP 422 for invalid records and a JSON response
      with errors inside JSON root `errors`, however DRF uses 400
      and errors without a JSON root.
    */
    didError: function(store, type, record, xhr) {
        if (xhr.status === 400) {
            var data = JSON.parse(xhr.responseText);
            var errors = {};

            // Convert error key names
            record.eachAttribute(function(name) {
                var attr = this.serializer.keyForAttributeName(type, name);
                if (attr in data) {
                    errors[name] = data[attr];
                }
            }, this);
            record.eachRelationship(function(name, relationship) {
                var attr = null;
                if (relationship.kind === 'belongsTo') {
                    attr = this.serializer.keyForBelongsTo(type, name);
                } else {
                    attr = this.serializer.keyForHasMany(type, name);
                }
                if (attr in data) {
                    errors[name] = data[attr];
                }
            }, this);

            store.recordWasInvalid(record, errors);
        } else {
            this._super.apply(this, arguments);
        }
    }
});
