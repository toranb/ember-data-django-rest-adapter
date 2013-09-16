// Version: 0.13.1-13-gd5fad5d
// Last commit: d5fad5d (2013-09-15 20:29:23 -0500)


(function() {
var define, requireModule;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  requireModule = function(name) {
    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    var mod, deps, callback, reified , exports;

    mod = registry[name];

    if (!mod) {
      throw new Error("Module '" + name + "' not found.");
    }

    deps = mod.deps;
    callback = mod.callback;
    reified = [];
    exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(requireModule(deps[i]));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;
  };
})();
(function() {
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

})();



(function() {
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
        var id = get(record, 'id'); //todo find pk (not always id)
        return this.ajax(this.buildURL(type.typeKey, id), "PUT", { data: data });
    },

    findMany: function(store, type, ids, parent) {
        var adapter, root, url;
        adapter = this;

        if (parent) {
            url = this.buildFindManyUrlWithParent(type, parent);
        } else {
            Ember.assert("You need to add belongsTo for type (" + type.typeKey + "). No Parent for this record was found");
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

        if (totalParents.length === 1 && totalHydrated.length === 1) {
            var parent_value = record.get(totalParents[0]).get('id'); //todo find pk (not always id)
            var parent_plural = Ember.String.pluralize(totalParents[0]);
            var endpoint = url.split('/').reverse()[1];
            return url.replace(endpoint, parent_plural + "/" + parent_value + "/" + endpoint);
        }

        return url;
    },

    buildUrlWithParentWhenAvailable: function(record, url, totalHydrated) {
        if (record && url && totalHydrated) {
            var parent_type = totalHydrated[0];
            var parent_pk = record.get(parent_type).get('id'); //todo find pk (not always id)
            var parent_plural = Ember.String.pluralize(parent_type);
            var endpoint = url.split('/').reverse()[1];
            url = url.replace(endpoint, parent_plural + "/" + parent_pk + "/" + endpoint);
        }
        return url;
    },

    buildFindManyUrlWithParent: function(type, parent) {
        var root, url, endpoint, parentValue;

        endpoint = Ember.String.pluralize(type.typeKey);
        parentValue = parent.get('id'); //todo find pk (not always id)
        root = parent.constructor.typeKey;
        url = this.buildURL(root, parentValue);

        return url + endpoint + '/';
    }

});

})();



(function() {

})();


})();
