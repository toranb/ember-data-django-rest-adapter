DS.DjangoRESTStore = DS.Store.extend({
    findMany: function(type, idsOrReferencesOrOpaque, record, relationship) {
        var ret;
        
        // check for hasMany relationship
        if (typeof relationship === 'object' && relationship.kind === 'hasMany') {
            record.set('findManyKey', relationship.key);
            record.set('findManyType', relationship.parentType);
        }
        
        ret = this._super(type, idsOrReferencesOrOpaque, record, relationship);
        
        // clear the variables we set to be clean
        record.set('findManyKey', null);
        record.set('findManyType', null);
        
        return ret;
    }
});
