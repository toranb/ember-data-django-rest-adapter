var get = Ember.get, set = Ember.set, isNone = Ember.isNone;

DS.DjangoRESTAdapter = DS.RESTAdapter.extend({
    defaultSerializer: "DS/djangoREST",

    /**
      Overrides the `pathForType` method to build underscored URLs.

      Stolen from ActiveModelAdapter

      ```js
        this.pathForType("famousPerson");
        //=> "famous_people"
      ```

      @method pathForType
      @param {String} type
      @returns String
    */
    pathForType: function(type) {
        var decamelized = Ember.String.decamelize(type);
        return Ember.String.pluralize(decamelized);
    },


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
        var adapter, root, url, endpoint;
        adapter = this;

        if (parent) {
            endpoint = this.getHasManyAttributeName(type, parent, ids);
            endpoint = store.serializerFor(type.typeKey).keyForAttribute(endpoint);
            url = this.buildFindManyUrlWithParent(type, parent, endpoint);
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

    buildFindManyUrlWithParent: function(type, parent, endpoint) {
        var root, url, endpoint, parentValue;

        parentValue = parent.get('id'); //todo find pk (not always id)
        root = parent.constructor.typeKey;
        url = this.buildURL(root, parentValue);

        return url + endpoint + '/';
    },

    /**
      Extract the attribute name given the parent record, the ids of the referenced model, and the type of
      the referenced model.

      Given the model definition

      ````
      App.User = DS.Model.extend({
          username: DS.attr('string'),
          aliases: DS.hasMany('speaker', { async: true})
          favorites: DS.hasMany('speaker', { async: true})
      });
      ````

      with a model object

      ````
      user1 = {
          id: 1,
          name: 'name',
          aliases: [2,3],
          favorites: [4,5]
      }
      
      type = App.Speaker;
      parent = user1;
      ids = [4,5]
      name = getHasManyAttributeName(type, parent, ids) // name === "favorites"
      ````

      @method getHasManyAttributeName
      @param {subclass of DS.Model} type
      @param {DS.Model} parent
      @param {Array} ids
      @returns String
    */
    getHasManyAttributeName: function(type, parent, ids) {
      var attributeName;

      parent.eachRelationship(function(name, relationship){
        var relationshipIds;
        if (relationship.kind === "hasMany" && relationship.type.typeKey === type.typeKey) {
          relationshipIds = parent._data[name].mapBy('id');
          if (Ember.compare(ids, relationshipIds) === 0) {
            attributeName = name;
          }
        }
      });

      return attributeName;
    }

});
