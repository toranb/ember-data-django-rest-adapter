var get = Ember.get;

DS.DjangoRESTAdapter = DS.RESTAdapter.extend({
  defaultSerializer: "DS/djangoREST",

  /**
   * Overrides the `pathForType` method to build underscored URLs.
   *
   * Stolen from ActiveModelAdapter
   *
   * ```js
   * this.pathForType("famousPerson");
   * //=> "famous_people"
   * ```
   *
   * @method pathForType
   * @param {String} type
   * @returns String
   */
  pathForType: function(type) {
    var decamelized = Ember.String.decamelize(type);
    return Ember.String.pluralize(decamelized);
  },

  createRecord: function(store, type, record) {
    var url = this.buildURL(type.typeKey);
    var data = store.serializerFor(type.typeKey).serialize(record);
    return this.ajax(url, "POST", { data: data });
  },

  updateRecord: function(store, type, record) {
    // Partial updates are expected to be sent as a PATCH
    var isPartial = false;
    record.eachAttribute(function(key, attribute) {
      if(attribute.options.readOnly){
        isPartial = true;
      }
    }, this);
    var method = isPartial ? "PATCH" : "PUT";

    var data = store.serializerFor(type.typeKey).serialize(record);
    var id = get(record, 'id'); //todo find pk (not always id)
    return this.ajax(this.buildURL(type.typeKey, id), method, { data: data });
  },

  findMany: function(store, type, ids, parent) {
    var url, endpoint, attribute;

    if (parent) {
      attribute = this.getHasManyAttributeName(type, parent, ids);
      endpoint = store.serializerFor(type.typeKey).keyForAttribute(attribute);
      url = this.buildFindManyUrlWithParent(type, parent, endpoint);
    } else {
      Ember.assert(
        "You need to add belongsTo for type (" + type.typeKey + "). No Parent for this record was found");
    }

    return this.ajax(url, "GET");
  },

  ajax: function(url, type, hash) {
    hash = hash || {};
    hash.cache = false;

    return this._super(url, type, hash);
  },

  ajaxError: function(jqXHR) {
    var error = this._super(jqXHR);

    if (jqXHR && jqXHR.status === 400) {
      var response = Ember.$.parseJSON(jqXHR.responseText), errors = {};

      Ember.EnumerableUtils.forEach(Ember.keys(response), function(key) {
        errors[Ember.String.camelize(key)] = response[key];
      });

      return new DS.InvalidError(errors);
    } else {
      return error;
    }
  },

  buildURL: function(type, id, record) {
    var url = this._super(type, id, record);

    if (url.charAt(url.length -1) !== '/') {
      url += '/';
    }

    return url;
  },

  buildFindManyUrlWithParent: function(type, parent, endpoint) {
    var root, url, parentValue;

    parentValue = parent.get('id'); //todo find pk (not always id)
    root = parent.constructor.typeKey;
    url = this.buildURL(root, parentValue);

    return url + endpoint + '/';
  },

  /**
   * Extract the attribute name given the parent record, the ids of the
   * referenced model, and the type of the referenced model.
   *
   * Given the model definition
   *
   * ```js
   * App.User = DS.Model.extend({
   *   username: DS.attr('string'),
   *   aliases: DS.hasMany('speaker', { async: true}),
   *   favorites: DS.hasMany('speaker', { async: true})
   * });
   * ```
   *
   * with a model object
   *
   * ```js
   * var user1 = {
   *   id: 1,
   *   name: 'name',
   *   aliases: [2,3],
   *   favorites: [4,5]
   * };
   *
   * var type = App.Speaker;
   * var parent = user1;
   * var ids = [4,5];
   * var name = getHasManyAttributeName(type, parent, ids)  // name === "favorites"
   * ```
   *
   * @method getHasManyAttributeName
   * @param {subclass of DS.Model} type
   * @param {DS.Model} parent
   * @param {Array} ids
   * @returns String
   */
  getHasManyAttributeName: function(type, parent, ids) {
    var attributeName;
    parent.eachRelationship(function(name, relationship){
      var relationshipIds;
      if (relationship.kind === "hasMany" && relationship.type.typeKey === type.typeKey) {
        relationshipIds = parent._data[name].mapBy('id');
        // check if all of the requested ids are covered by this attribute
        if (Ember.EnumerableUtils.intersection(ids, relationshipIds).length === ids.length) {
          attributeName = name;
        }
      }
    });
    return attributeName;
  }
});
