var get = Ember.get, set = Ember.set, isNone = Ember.isNone;

DS.DjangoRESTAdapter = DS.RESTAdapter.extend({
    defaultSerializer: "DS/djangoREST",

    createRecord: function(store, type, record) {
      var url = this.getCorrectPostUrl(record, this.buildURL(type.typeKey));
      var data = store.serializerFor(type.typeKey).serialize(record);
      return this.ajax(url, "POST", { data: data });
    },

    updateRecord: function(store, type, record) {
      var data = store.serializerFor(type.typeKey).serialize(record);
      var id = get(record, 'id');
      return this.ajax(this.buildURL(type.typeKey, id), "PUT", { data: data });
    },

    findMany: function(store, type, ids, parent) {
        var url;

        if (parent) {
            url = this.buildFindManyUrlWithParent(type, parent);
        } else {
            console.log("untested currently");
            console.log("will models w/ multiple parents do this?");
            url = this.buildURL(type.typeKey);
        }

        return this.ajax(url, "GET");
    },

    ajax: function(url, type, hash) {
      hash = hash || {};
      hash.cache = false;

      return this._super(url, type, hash);
    },

    buildURL: function(type, id) {
        var url = this._super(type, id);

        if (url.charAt(url.length -1) !== '/') {
            url += '/';
        }

        return url;
    },

    getBelongsTo: function(record) {
        var totalParents = [];
        record.eachRelationship(function(name, relationship) {
            if (relationship.kind === 'belongsTo') {
                totalParents.push(name);
            }
        }, this);
        return totalParents;
    },

    getNonEmptyRelationships: function(record, totalParents) {
        var totalHydrated = [];
        totalParents.forEach(function(item) {
            if (record.get(item) !== null) {
                totalHydrated.push(item);
            }
        }, this);
        return totalHydrated;
    },

    getCorrectPostUrl: function(record, url) {
        var totalParents = this.getBelongsTo(record);
        var totalHydrated = this.getNonEmptyRelationships(record, totalParents);
        if (totalParents.length > 1 && totalHydrated.length <= 1) {
            return this.buildUrlWithParentWhenAvailable(record, url, totalHydrated);
        }
        return url;
    },

    buildUrlWithParentWhenAvailable: function(record, url, totalHydrated) {
        if (record && url && totalHydrated) {
            var parent_type = totalHydrated[0];
            var parent_pk = record.get(parent_type).get('id');
            var parent_plural = Ember.String.pluralize(parent_type);
            var endpoint = url.split('/').reverse()[1];
            url = url.replace(endpoint, parent_plural + "/" + parent_pk + "/" + endpoint);
        }
        return url;
    },

    buildFindManyUrlWithParent: function(type, parent) {
        var root, url, endpoint, parentValue;

        endpoint = Ember.String.pluralize(type.typeKey);
        parentValue = parent.get('id');
        root = parent.constructor.typeKey;
        url = this.buildURL(root, parentValue);

        return url + endpoint + '/';
    }

});
