// boilerplate taken from ember-data rest adapter tests

var get = Ember.get, set = Ember.set;
var Adapter, Person, Group, Role, CamelCase, Animal, Herd, adapter, serializer, store, ajaxUrl, ajaxType, ajaxHash, recordArrayFlags, manyArrayFlags;
var forEach = Ember.EnumerableUtils.forEach;

// Note: You will need to ensure that you do not attempt to assert against flags that do not exist in this array (or else they will show positive).
recordArrayFlags = ['isLoaded'];
manyArrayFlags = ['isLoaded'];

// Used for testing the adapter state path on a single entity
function stateEquals(entity, expectedState) {
    var actualState = get(entity, 'stateManager.currentPath');

    actualState = actualState && actualState.replace(/^rootState\./,'');
    equal(actualState, expectedState, 'Expected state should have been: ' + expectedState+ ' but was: ' +  actualState + ' on: ' + entity);
}

// Used for testing the adapter state path on a collection of entities
function statesEqual(entities, expectedState) {
    forEach(entities, function(entity) {
        stateEquals(entity, expectedState);
    });
}

// Used for testing all of the flags on a single entity
// onlyCheckFlagArr is to only check a subset of possible flags
function enabledFlags(entity, expectedFlagArr, onlyCheckFlagArr) {
    var possibleFlags;
    if(onlyCheckFlagArr){
        possibleFlags = onlyCheckFlagArr;
    } else {
        possibleFlags = ['isLoading', 'isLoaded', 'isReloading', 'isDirty', 'isSaving', 'isDeleted', 'isError', 'isNew', 'isValid'];
    }

    forEach(possibleFlags, function(flag) {
        var expectedFlagValue, actualFlagValue;

        expectedFlagValue = expectedFlagArr.indexOf(flag) !== -1;
        actualFlagValue = entity.get(flag);

        equal(actualFlagValue, expectedFlagValue, 'Expected flag ' + flag + ' should have been: ' + expectedFlagValue + ' but was: ' + actualFlagValue + ' on: '  + entity);
    });
}

// Used for testing all of the flags on a collection of entities
function enabledFlagsForArray(entities, expectedFlagArr, onlyCheckFlagArr) {
    forEach(entities, function(entity) {
        enabledFlags(entity, expectedFlagArr, onlyCheckFlagArr);
    });
}

// Used for testing a request url to a remote URL
var expectUrl = function(url, desc) {
    equal(ajaxUrl, url, "the URL is " + desc);
};

// Used for testing a request type to a remote URL
var expectType = function(type) {
    equal(ajaxType, type, "the HTTP method is " + type);
};

// Used to test that data is being passed to a remote URL
var expectData = function(hash) {
    deepEqual(ajaxHash.data, hash, "the hash was passed along");
};

module("Django REST Adapter", {
    setup: function() {
        ajaxUrl = undefined;
        ajaxType = undefined;
        ajaxHash = undefined;

        Adapter = DS.DjangoRESTAdapter.extend();
        Adapter.configure('plurals', {
            person: 'people'
        });

        adapter = Adapter.create({
            ajax: function(url, type, hash) {
                return new Ember.RSVP.Promise(function(resolve, reject) {
                    hash = hash || {};
                    hash.context = adapter;

                    ajaxUrl = url;
                    ajaxType = type;
                    ajaxHash = hash;

                    hash.success = function(json) {
                        Ember.run(function() {
                            resolve(json);
                        });
                    };

                    hash.error = function(xhr) {
                        Ember.run(function() {
                            reject(xhr);
                        });
                    };
                });
            }
        });

        serializer = get(adapter, 'serializer');

        store = DS.DjangoRESTStore.create({
            adapter: adapter
        });

        Person = DS.Model.extend({
            name: DS.attr('string')
        });

        Person.toString = function() {
            return "App.Person";
        };

        Group = DS.Model.extend({
            name: DS.attr('string'),
            zpeople: DS.hasMany(Person)
        });

        Group.toString = function() {
            return "App.Group";
        };

        Person.reopen({
            group: DS.belongsTo(Group)
        });

        Role = DS.Model.extend({
            name: DS.attr('string')
        });

        Role.toString = function() {
            return "App.Role";
        };

        CamelCase = DS.Model.extend({
            name: DS.attr('string'),
            camelPeople: DS.hasMany(Person)
        });

        CamelCase.toString = function() {
            return "App.CamelCase";
        };

        Animal = DS.Model.extend({
            name: DS.attr('string')
        });

        Animal.toString = function() {
            return "App.Animal";
        };

        Herd = DS.Model.extend({
            name: DS.attr('string'),
            members: DS.hasMany(Animal),
            outcasts: DS.hasMany(Animal)
        });

        Herd.toString = function() {
            return "App.Herd";
        };

    }
});

test("ajax calls are made with cache set to false for IE compatibility", function() {
    var originalAjax = Ember.$.ajax;
    
    try {
        Ember.$.ajax = function (hash) {
            ajaxHash = hash;
        };
        adapter = Adapter.create();
        adapter.ajax('/some/url/', 'GET');
        equal(ajaxHash.cache, false, "Cache is false");
    } finally {
        Ember.$.ajax = originalAjax;
    }
});

test("creating a person makes a POST to /people/, with the data hash", function() {
    // setup
    var person = store.createRecord(Person, {name: "John Doe"});
    
    // test
    stateEquals(person, "loaded.created.uncommitted");
    enabledFlags(person, ['isLoaded', 'isDirty', 'isNew', 'isValid']);
    
    // setup
    store.commit();
    
    // test
    stateEquals(person, 'loaded.created.inFlight');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isNew', 'isValid', 'isSaving']);
    expectUrl("/people/", "the collection at the plural of the model name with trailing slash");
    expectType("POST");
    expectData({ name: "John Doe", group: null });
    
    // setup
    ajaxHash.success({ id: 1, name: "John Doe" });

    // test
    stateEquals(person, 'loaded.saved');
    enabledFlags(person, ['isLoaded', 'isValid']);
    equal(person, store.find(Person, 1), "it is now possible to retrieve the person by the ID supplied");
});

test("updating a person makes a PUT to /people/:id/ with the data hash", function() {
    // setup
    var person;
    store.load(Person, { id: 1, name: "John Doe" });
    person = store.find(Person, 1);

    // test
    stateEquals(person, 'loaded.saved');
    enabledFlags(person, ['isLoaded', 'isValid']);

    // setup
    set(person, 'name', 'Jane Doe');

    // test
    stateEquals(person, 'loaded.updated.uncommitted');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isValid']);

    // setup
    store.commit();

    // test
    stateEquals(person, 'loaded.updated.inFlight');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isSaving', 'isValid']);
    expectUrl("/people/1/", "the plural of the model name with its ID, and trailing slash");
    expectType("PUT");
    expectData({ name: "Jane Doe", group: null });

    // setup
    ajaxHash.success({ id: 1, name: "Jane Doe" });

    // test
    stateEquals(person, 'loaded.saved');
    enabledFlags(person, ['isLoaded', 'isValid']);
    equal(person, store.find(Person, 1), "the same person is retrieved by the same ID");
    equal(get(person, 'name'), "Jane Doe", "the hash should be updated");
});

test("updating a group makes a PUT to /groups/:id/ with the data hash", function() {
    // setup
    var group, people;
    store.load(Group, { id: 1, name: "Doe Family", zpeople: [ 1, 2 ] });
    group = store.find(Group, 1);

    // test
    stateEquals(group, 'loaded.saved');
    enabledFlags(group, ['isLoaded', 'isValid']);

    // setup
    set(group, 'name', 'New Doe Family Name');

    // test
    stateEquals(group, 'loaded.updated.uncommitted');
    enabledFlags(group, ['isLoaded', 'isDirty', 'isValid']);

    // setup
    store.commit();

    // test
    stateEquals(group, 'loaded.updated.inFlight');
    enabledFlags(group, ['isLoaded', 'isDirty', 'isSaving', 'isValid']);
    expectUrl("/groups/1/", "the plural of the model name with its ID, and trailing slash");
    expectType("PUT");
    expectData({ name: "New Doe Family Name", zpeople: [1,2] });

    // setup
    ajaxHash.success({ id: 1, name: "New Doe Family Name" });

    // test
    stateEquals(group, 'loaded.saved');
    enabledFlags(group, ['isLoaded', 'isValid']);
    equal(group, store.find(Group, 1), "the same group is retrieved by the same ID");
    equal(get(group, 'name'), "New Doe Family Name", "the hash should be updated");
});

test("deleting a person makes a DELETE to /people/:id/", function() {
    // setup
    var person;
    store.load(Person, { id: 1, name: "John Doe" });
    person = store.find(Person, 1);

    // test
    stateEquals(person, 'loaded.saved');
    enabledFlags(person, ['isLoaded', 'isValid']);

    // setup
    person.deleteRecord();

    // test
    stateEquals(person, 'deleted.uncommitted');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isDeleted', 'isValid']);

    // setup
    store.commit();

    // test
    stateEquals(person, 'deleted.inFlight');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isSaving', 'isDeleted', 'isValid']);
    expectUrl("/people/1/", "the plural of the model name with its ID, and trailing slash");
    expectType("DELETE");

    // setup
    ajaxHash.success();

    // test
    stateEquals(person, 'deleted.saved');
    enabledFlags(person, ['isLoaded', 'isDeleted', 'isValid']);
});

test("finding all people makes a GET to /people/", function() {
    // setup
    var person, people;
    people = store.find(Person);

    // test
    enabledFlags(people, ['isLoaded', 'isValid'], recordArrayFlags);
    expectUrl("/people/", "the plural of the model name, with trailing slash");
    expectType("GET");

    // setup
    ajaxHash.success([{ id: 1, name: "John Doe" }]);
    person = people.objectAt(0);

    // test
    statesEqual(people, 'loaded.saved');
    stateEquals(person, 'loaded.saved');
    enabledFlagsForArray(people, ['isLoaded', 'isValid']);
    enabledFlags(person, ['isLoaded', 'isValid']);
    equal(person, store.find(Person, 1), "the record is now in the store, and can be looked up by ID without another Ajax request");
});

test("properly un-CamelCase root object /camel_case/", function() {
    // setup
    var person, people;
    people = store.find(CamelCase);

    // test
    enabledFlags(people, ['isLoaded', 'isValid'], recordArrayFlags);
    expectUrl("/camel_cases/", "the plural of the model name, with trailing slash");
    expectType("GET");

    // setup
    ajaxHash.success([{ id: 1, name: "John Doe" }]);
    person = people.objectAt(0);

    // test
    statesEqual(people, 'loaded.saved');
    stateEquals(person, 'loaded.saved');
    enabledFlagsForArray(people, ['isLoaded', 'isValid']);
    enabledFlags(person, ['isLoaded', 'isValid']);
    equal(person, store.find(CamelCase, 1), "the record is now in the store, and can be looked up by ID without another Ajax request");
});

test("finding a person by ID makes a GET to /people/:id/", function() {
    // setup
    var person = store.find(Person, 1);

    // test
    stateEquals(person, 'loading');
    enabledFlags(person, ['isLoading', 'isValid']);
    expectUrl("/people/1/", "the plural of the model name with the ID requested, with trailing slash");
    expectType("GET");

    // setup
    ajaxHash.success({ id: 1, name: "John Doe" });

    // test
    stateEquals(person, 'loaded.saved');
    enabledFlags(person, ['isLoaded', 'isValid']);
    equal(person, store.find(Person, 1), "the record is now in the store, and can be looked up by ID without another Ajax request");
});

test("finding people by a query", function() {
    // setup
    var people, john, jane, jake;
    people = store.find(Person, { page: 1 });

    // test
    equal(get(people, 'length'), 0, "there are no people yet, as the query has not returned");
    enabledFlags(people, ['isLoading'], recordArrayFlags);
    expectUrl("/people/", "the collection at the plural of the model name, with trailing slash");
    expectType("GET");
    expectData({ page: 1 });

    // setup
    ajaxHash.success([
        { id: 1, name: "John Doe" },
        { id: 2, name: "Jane Doe" },
        { id: 3, name: "Jake Doe" }
    ]);
    john = people.objectAt(0);
    jane = people.objectAt(1);
    jake = people.objectAt(2);

    // test
    statesEqual([john, jane, jake], 'loaded.saved');
    enabledFlags(people, ['isLoaded'], recordArrayFlags);
    enabledFlagsForArray([john, jane, jake], ['isLoaded'], recordArrayFlags);
    equal(get(people, 'length'), 3, "the people are now loaded");
    equal(get(john, 'name'), "John Doe");
    equal(get(jane, 'name'), "Jane Doe");
    equal(get(jake, 'name'), "Jake Doe");
    equal(get(john, 'id'), 1);
    equal(get(jane, 'id'), 2);
    equal(get(jake, 'id'), 3);
});

test("finding all people in a group makes a GET to /groups/:id/zpeople/", function() {
    // setup
    var group, people;
    store.load(Group, { id: 1, name: "Doe Family", zpeople: [ 1, 2 ] });
    group = store.find(Group, 1);
    people = get(group, 'zpeople');
    
    // test
    expectUrl("/groups/1/zpeople/", "the nested URL for the field name on the parent model");
});

test("finding all people in a camel_case makes a GET to /camel_cases/:id/camel_people/", function() {
    // setup
    var camel_case, people;
    store.load(CamelCase, { id: 1, name: "Case full of camels", camel_people: [ 1, 2 ] });
    camel_case = store.find(CamelCase, 1);
    people = get(camel_case, 'camelPeople');
    
    // test
    expectUrl("/camel_cases/1/camel_people/", "the nested URL for the field name on the parent model");
});

test("finding all people in a group that contains multiple nested attributes of the same type makes a GET to the correct attribute-based URL", function() {
    // setup
    var herd, members, outcasts;
    store.load(Herd, { id: 2, name: "Elephants", members: [ 3, 4 ], outcasts: [ 5, 6 ] });
    herd = store.find(Herd, 2);

    // test the first attribute
    members = get(herd, 'members');
    expectUrl("/herds/2/members/", "the nested URL for the field name on the parent model");

    // check that both of the Animal attributes are retrieved correctly
    outcasts = get(herd, 'outcasts');
    expectUrl("/herds/2/outcasts/", "the nested URL for the field name on the parent model");
});

test("if you specify a namespace then it is prepended onto all URLs", function() {
    // setup
    var person;
    set(adapter, 'namespace', 'ember');
    person = store.find(Person, 1);

    // test
    expectUrl("/ember/people/1/", "the namespace, followed by the plural of the model name and the id");
});

test("if you specify a url then that custom url is used", function() {
    // setup
    var person;
    set(adapter, 'url', 'http://api.ember.dev');
    person = store.find(Person, 1);

    // test
    expectUrl("http://api.ember.dev/people/1/", "the custom url, followed by the plural of the model name and the id");
});

var originalLogger = Ember.Logger.error;

var patchLogger = function() {
    Ember.Logger.error = function() { };
};

var restoreLogger = function() {
    Ember.Logger.error = originalLogger;
};

test("creating a record with a 400 error marks the records as invalid", function() {
    // setup
    var person, mockXHR;
    person = store.createRecord(Person, { name: "" });
    store.commit();
    mockXHR = {
        status:       400,
        responseText: JSON.stringify({ name: ["can't be blank"] })
    };

    patchLogger();
    ajaxHash.error.call(ajaxHash.context, mockXHR);
    restoreLogger();

    // test
    stateEquals(person, 'loaded.created.invalid');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isNew']);
    deepEqual(person.get('errors'), { name: ["can't be blank"]}, "the person has the errors");
});

test("updating a record with a 400 error marks the records as invalid", function() {
    // setup
    var person, mockXHR;
    Person.reopen({
        updatedAt: DS.attr('date')
    });
    store.load(Person, { id: 1, name: "John Doe" });
    person = store.find(Person, 1);

    // test
    stateEquals(person, 'loaded.saved');
    enabledFlags(person, ['isLoaded', 'isValid']);

    // setup
    person.set('name', '');

    // test
    stateEquals(person, 'loaded.updated.uncommitted');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isValid']);

    // setup
    store.commit();

    // test
    stateEquals(person, 'loaded.updated.inFlight');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isSaving', 'isValid']);

    // setup
    mockXHR = {
        status:       400,
        responseText: JSON.stringify({ name: ["can't be blank"], updated_at: ["can't be blank"] })
    };

    patchLogger();
    ajaxHash.error.call(ajaxHash.context, mockXHR);
    restoreLogger();

    // test
    stateEquals(person, 'loaded.updated.invalid');
    enabledFlags(person, ['isLoaded', 'isDirty']);
    deepEqual(person.get('errors'), { name: ["can't be blank"], updatedAt: ["can't be blank"] }, "the person has the errors");
});

test("creating a record with a 500 error marks the record as error", function() {
    // setup
    var person, mockXHR;
    person = store.createRecord(Person, { name: "" });

    // test
    stateEquals(person, 'loaded.created.uncommitted');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isNew', 'isValid']);

    // setup
    store.commit();

    // test
    stateEquals(person, 'loaded.created.inFlight');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isSaving', 'isNew', 'isValid']);

    // setup
    mockXHR = {
        status:       500,
        responseText: 'Internal Server Error'
    };

    patchLogger();
    ajaxHash.error.call(ajaxHash.context, mockXHR);
    restoreLogger();

    // test
    stateEquals(person, 'error');
    enabledFlags(person, ['isError', 'isValid']);
});

test("updating a record with a 500 error marks the record as error", function() {
    // setup
    var person, mockXHR;
    store.load(Person, { id: 1, name: "John Doe" });
    person = store.find(Person, 1);

    // test
    stateEquals(person, 'loaded.saved');
    enabledFlags(person, ['isLoaded', 'isValid']);

    // setup
    person.set('name', 'Jane Doe');

    // test
    stateEquals(person, 'loaded.updated.uncommitted');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isValid']);

    // setup
    store.commit();

    // test
    stateEquals(person, 'loaded.updated.inFlight');
    enabledFlags(person, ['isLoaded', 'isDirty', 'isSaving', 'isValid']);

    // setup
    mockXHR = {
    status:       500,
    responseText: 'Internal Server Error'
    };

    patchLogger();
    ajaxHash.error.call(ajaxHash.context, mockXHR);
    restoreLogger();

    // test
    stateEquals(person, 'error');
    enabledFlags(person, ['isError', 'isValid']);
});

test("finding all people in a paginated result - first page", function() {
    // setup
    var people, userA, userB, metadata, pagination;
    people = store.find(Person, {page: 1});
    ajaxHash.success({
        count: 7,
        next: 'http://example.com/api/people/?page=2',
        previous: null,
        results: [
            { id: 1, name: "User One" },
            { id: 2, name: "User Two" },
        ],
    });
    userA = people.objectAt(0);
    userB = people.objectAt(1);
    pagination = store.typeMapFor(Person).metadata.pagination;

    // test
    statesEqual([userA, userB], 'loaded.saved');
    enabledFlags(people, ['isLoaded'], recordArrayFlags);
    enabledFlagsForArray([userA, userB], ['isLoaded'], recordArrayFlags);
    equal(get(people, 'length'), 2, "there are two people in the results");
    equal(get(userA, 'name'), 'User One');
    equal(get(userB, 'name'), 'User Two');
    equal(get(userA, 'id'), 1);
    equal(get(userB, 'id'), 2);
    equal(pagination.items.total, 7);
    equal(pagination.items.first, 1);
    equal(pagination.items.last, 2);
    equal(pagination.items.per_page, 2);
    equal(pagination.page.total, 4);
    equal(pagination.page.current, 1);
    equal(pagination.page.next, 2);
    equal(pagination.page.previous, false);
});

test("finding all people in a paginated result - second page", function() {
    // setup
    var people, userA, userB, metadata, pagination;
    people = store.find(Person, {page: 2});
    ajaxHash.success({
        count: 7,
        next: 'http://example.com/api/people/?page=3',
        previous: 'http://example.com/api/people/?page=1',
        results: [
            { id: 3, name: "User Three" },
            { id: 4, name: "User Four" },
        ],
    });
    userA = people.objectAt(0);
    userB = people.objectAt(1);
    pagination = store.typeMapFor(Person).metadata.pagination;

    // test
    statesEqual([userA, userB], 'loaded.saved');
    enabledFlags(people, ['isLoaded'], recordArrayFlags);
    enabledFlagsForArray([userA, userB], ['isLoaded'], recordArrayFlags);
    equal(get(people, 'length'), 2, "there are two people in the results");
    equal(get(userA, 'name'), 'User Three');
    equal(get(userB, 'name'), 'User Four');
    equal(get(userA, 'id'), 3);
    equal(get(userB, 'id'), 4);
    equal(pagination.items.total, 7);
    equal(pagination.items.first, 3);
    equal(pagination.items.last, 4);
    equal(pagination.items.per_page, 2);
    equal(pagination.page.total, 4);
    equal(pagination.page.current, 2);
    equal(pagination.page.next, 3);
    equal(pagination.page.previous, 1);

});

test("finding all people in a paginated result - last page", function() {
    // setup
    var people, user, metadata, pagination;
    people = store.find(Person, {page: 4});
    ajaxHash.success({
        count: 7,
        next: null,
        previous: 'http://example.com/api/people/?page=3',
        results: [
            { id: 7, name: "User Seven" },
        ],
    });
    user = people.objectAt(0);
    pagination = store.typeMapFor(Person).metadata.pagination;

    // test
    statesEqual([user], 'loaded.saved');
    enabledFlags(people, ['isLoaded'], recordArrayFlags);
    enabledFlagsForArray([user], ['isLoaded'], recordArrayFlags);
    equal(get(people, 'length'), 1, "there is one people in the results");
    equal(get(user, 'name'), 'User Seven');
    equal(get(user, 'id'), 7);
    equal(pagination.items.total, 7);
    equal(pagination.items.first, 7);
    equal(pagination.items.last, 7);
    equal(pagination.items.per_page, 2);
    equal(pagination.page.total, 4);
    equal(pagination.page.current, 4);
    equal(pagination.page.next, false);
    equal(pagination.page.previous, 3);

});

test("finding all people in a paginated result - only one page", function() {
    // setup
    var people, user, metadata, pagination;
    people = store.find(Person, {page: 1});
    ajaxHash.success({
        count: 5,
        next: null,
        previous: null,
        results: [
            { id: 1, name: "User One" },
            { id: 2, name: "User Two" },
            { id: 3, name: "User Three" },
            { id: 4, name: "User Four" },
            { id: 5, name: "User Five" },
        ],
    });
    user = people.objectAt(0);
    pagination = store.typeMapFor(Person).metadata.pagination;

    // test
    statesEqual([user], 'loaded.saved');
    enabledFlags(people, ['isLoaded'], recordArrayFlags);
    enabledFlagsForArray([user], ['isLoaded'], recordArrayFlags);
    equal(get(people, 'length'), 5, "there are five people in the results");
    equal(pagination.items.total, 5);
    equal(pagination.items.first, 1);
    equal(pagination.items.last, 5);
    equal(pagination.items.per_page, undefined);
    equal(pagination.page.total, 1);
    equal(pagination.page.current, 1);
    equal(pagination.page.next, false);
    equal(pagination.page.previous, false);

});
