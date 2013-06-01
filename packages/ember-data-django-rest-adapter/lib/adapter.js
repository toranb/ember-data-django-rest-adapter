(function() {
    var get = Ember.get, set = Ember.set;

    DS.DjangoRESTAdapter = DS.RESTAdapter.extend({

        bulkCommit: false,
        serializer: DS.DjangoRESTSerializer,

        createRecord: function(store, type, record) {
            var json = {}
            , adapter = this
            , root = this.rootForType(type)
            , data  = record.serialize()
            , url = this.getCorrectPostUrl(record, this.buildURL(root));

            return this.ajax(url, "POST", {
              data: data
            }).then(function(pre_json){
              json[root] = pre_json;
              adapter.didCreateRecord(store, type, record, json);
            }, function(xhr) {
              adapter.didError(store, type, record, xhr);
              throw xhr;
            }).then(null, rejectionHandler);
        },

        updateRecord: function(store, type, record) {
            var json = {}
            , adapter = this
            , id = get(record, 'id')
            , root = this.rootForType(type)
            , data  = record.serialize();

            return this.ajax(this.buildURL(root, id), "PUT",{
              data: data
            }).then(function(pre_json){
              json[root] = pre_json;
              adapter.didUpdateRecord(store, type, record, json);
            }, function(xhr) {
              adapter.didError(store, type, record, xhr);
              throw xhr;
            }).then(null, rejectionHandler);
        },

        findMany: function(store, type, ids, parent) {
            var json = {}
            , adapter = this
            , root = this.rootForType(type)
            , plural = this.pluralize(root)
            , ids = this.serializeIds(ids)
            , url = this.buildFindManyUrlWithParent(store, type, ids, parent);

            return this.ajax(url, "GET", {
              data: {ids: ids}
            }).then(function(pre_json) {
              json[plural] = pre_json;
              adapter.didFindMany(store, type, json);
            }).then(null, rejectionHandler);
        },

        findAll: function(store, type, since) {
            var json = {}
            , adapter = this
            , root = this.rootForType(type)
            , plural = this.pluralize(root);

            return this.ajax(this.buildURL(root), "GET",{
              data: this.sinceQuery(since)
            }).then(function(pre_json) {
              json[plural] = pre_json;
              adapter.didFindAll(store, type, json);
            }).then(null, rejectionHandler);
        },

        findQuery: function(store, type, query, recordArray) {
            var json = {}
            , adapter = this
            , root = this.rootForType(type)
            , plural = this.pluralize(root);

            return this.ajax(this.buildURL(root), "GET", {
              data: query
            }).then(function(pre_json){
              json[plural] = pre_json;
              adapter.didFindQuery(store, type, json, recordArray);
            }).then(null, rejectionHandler);
        },

        find: function(store, type, id) {
            var json = {}
            , adapter = this
            , root = this.rootForType(type);

            return this.ajax(this.buildURL(root, id), "GET").
              then(function(pre_json){
                json[root] = pre_json;
                adapter.didFindRecord(store, type, json, id);
            }).then(null, rejectionHandler);
        },

        ajax: function(url, type, hash) {
          var adapter = this;
          hash = hash || {};

          return new Ember.RSVP.Promise(function(resolve, reject) {
            hash.url = url;
            hash.type = type;
            hash.dataType = 'json';
            hash.cache = false;
            hash.context = adapter;

            hash.success = function(json) {
              Ember.run(null, resolve, json);
            };

            hash.error = function(jqXHR, textStatus, errorThrown) {
              Ember.run(null, reject, errorThrown);
            };

            jQuery.ajax(hash);
          });
        },

        buildURL: function(record, suffix) {
            var url = this._super(record, suffix);
            if (url.charAt(url.length -1) !== '/') {
                url += '/';
            }
            return url;
        },

        buildFindManyUrlWithParent: function(store, type, ids, parent) {
            if (!parent) {
                Ember.assert("You need to add belongsTo for type (" + type + "). No Parent for this record was found");
            }

            var root = this.rootForType(type);
            var url = this.buildURL(root);
            var parentType = this.getTypeForModel(parent);
            var record = Ember.Object.create({'parent_type': parentType, 'parent_value': parent.get('id')});

            return this.buildUrlWithParentWhenAvailable(record, url);
        },

        getTypeForModel: function(model) {
            return model.toString().split(":")[0].replace("<", "");
        },

        getBelongsTo: function(record) {
            var totalParents = [];
            record.eachRelationship(function(name, relationship) {
                if (relationship.kind == 'belongsTo') {
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
                return this.buildUrlWithParentWhenAvailable(record, url);
            } else if (totalParents.length === 1) {
                return this.buildUrlWithParentWhenAvailable(record, url);
            }
            return url;
        },

        buildUrlWithParentWhenAvailable: function(record, url) {
            var parent_type = record.parent_type || record.get('parent_type');
            var parent_value = record.parent_value || record.get('parent_value');

            if (parent_type && parent_value) {
                var parent_key = this.rootForType(parent_type);
                var endpoint = url.split('/').reverse()[1];
                var parent_plural = this.pluralize(parent_key);
                url = url.replace(endpoint, parent_plural + "/" + parent_value + "/" + endpoint);
            }
            return url;
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
                // https://github.com/emberjs/data/blob/master/packages/ember-data/lib/system/store.js#L1010-L1012
                record.eachAttribute(function(name) {
                    var attr = this.serializer.keyForAttributeName(type, name);
                    if (attr in data) {
                        errors[name] = data[attr];
                    }
                }, this);
                record.eachRelationship(function(name, relationship) {
                    var attr = null;
                    if (relationship.kind == 'belongsTo') {
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

})();
