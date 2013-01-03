var get = Ember.get, set = Ember.set;

var adapter, store, ajaxUrl, ajaxType, ajaxHash;
var Person, person, people;
var Role, role, roles;
var Group, group;
var Task, task;

var REVISION = 11; //ember-data revision

module("DjangoRESTAdapter", {
  setup: function() {
    ajaxUrl = undefined;
    ajaxType = undefined;
    ajaxHash = undefined;

    adapter = DS.DjangoRESTAdapter.create({
      plurals: {
        person: 'people'
      },
      ajax: function(url, type, hash) {
        var success = hash.success, self = this;

        ajaxUrl = url;
        ajaxType = type;
        ajaxHash = hash;

        if (success) {
          hash.success = function(json, type) {
            success.call(self, json);
          };
        }
      }

    });

    store = DS.Store.create({
      adapter: adapter,
      revision: REVISION
    });

    Person = DS.Model.extend({
      name: DS.attr('string'),
      tasks: DS.hasMany('Task')
    });

    Person.toString = function() {
      return "App.Person";
    };

    Group = DS.Model.extend({
      name: DS.attr('string'),
      people: DS.hasMany('Person')
    });

    Group.toString = function() {
      return "App.Group";
    };

    Role = DS.Model.extend({
      name: DS.attr('string'),
      primaryKey: '_id'
    });

    Role.toString = function() {
      return "App.Role";
    };

    Task = DS.Model.extend({
      name: DS.attr('string'),
      owner: DS.belongsTo('Person')
    });

    Task.toString = function() {
      return "App.Task";
    };
  },

  teardown: function() {
    adapter.destroy();
    store.destroy();

    if (person) { person.destroy(); }
  }
});

var expectUrl = function(url, desc) {
  equal(ajaxUrl, url, "the URL is " + desc);
};

var expectType = function(type) {
  equal(type, ajaxType, "the HTTP method is " + type);
};

var expectData = function(hash) {
  deepEqual(hash, ajaxHash.data, "the hash was passed along");
};

var expectState = function(state, value, p) {
  p = p || person;

  if (value === undefined) { value = true; }

  var flag = "is" + state.charAt(0).toUpperCase() + state.substr(1);
  equal(get(p, flag), value, "the person is " + (value === false ? "not " : "") + state);
};

var expectStates = function(state, value) {
  people.forEach(function(person) {
    expectState(state, value, person);
  });
};

test("creating a person makes a POST to /people, with the data hash", function() {
  set(adapter, 'bulkCommit', false);

  person = store.createRecord(Person, { name: "Tom Dale" });

  expectState('new');
  store.commit();
  expectState('saving');

  expectUrl("/people", "the collection is the same as the model name");
  expectType("POST");
  expectData({ name: "Tom Dale", tasks: [] });

  ajaxHash.success({ id: 1, name: "Tom Dale" });
  expectState('saving', false);

  person = store.find(Person, 1);

  equal(person.get('name'), "Tom Dale", "it is now possible to retrieve the person by the ID supplied");
});

test("updating a person makes a PUT to /people/:id with the data hash", function() {
  set(adapter, 'bulkCommit', false);

  store.load(Person, { id: 1, name: "Yehuda Katz" });

  person = store.find(Person, 1);

  expectState('new', false);
  expectState('loaded');
  expectState('dirty', false);

  set(person, 'name', "Brohuda Brokatz");

  expectState('dirty');
  store.commit();
  expectState('saving');

  expectUrl("/people/1", "the plural of the model name with its ID");
  expectType("PUT");

  ajaxHash.success({ id: 1, name: "Brohuda Brokatz" });
  expectState('saving', false);

  person = store.find(Person, 1);

  equal(get(person, 'name'), "Brohuda Brokatz", "the hash should be updated");
});


test("updates are not required to return data", function() {
  set(adapter, 'bulkCommit', false);

  store.load(Person, { id: 1, name: "Yehuda Katz" });

  person = store.find(Person, 1);

  expectState('new', false);
  expectState('loaded');
  expectState('dirty', false);

  set(person, 'name', "Brohuda Brokatz");

  expectState('dirty');
  store.commit();
  expectState('saving');

  expectUrl("/people/1", "the plural of the model name with its ID");
  expectType("PUT");

  ajaxHash.success();
  expectState('saving', false);

  equal(person, store.find(Person, 1), "the same person is retrieved by the same ID");
  equal(get(person, 'name'), "Brohuda Brokatz", "the data is preserved");
});

test("deleting a person makes a DELETE to /people/:id", function() {
  set(adapter, 'bulkCommit', false);

  store.load(Person, { id: 1, name: "Tom Dale" });

  person = store.find(Person, 1);

  expectState('new', false);
  expectState('loaded');
  expectState('dirty', false);

  person.deleteRecord();

  expectState('dirty');
  expectState('deleted');
  store.commit();
  expectState('saving');

  expectUrl("/people/1", "the plural of the model name with its ID");
  expectType("DELETE");

  ajaxHash.success();
  expectState('deleted');
});

test("finding a person by ID makes a GET to /people/:id", function() {
  person = store.find(Person, 1);

  expectState('loaded', false);
  expectUrl("/people/1", "the plural of the model name with the ID requested");
  expectType("GET");

  ajaxHash.success({ id: 1, name: "Yehuda Katz" });

  expectState('loaded');
  expectState('dirty', false);

  equal(person, store.find(Person, 1), "the record is now in the store, and can be looked up by ID without another Ajax request");
});

test("if you do not set a namespace then it will not be prepended", function() {
  person = store.find(Person, 1);
  expectUrl("/people/1", "the namespace, followed by by the plural of the model name and the id");
});

test("if you specify a namespace then it is prepended onto all URLs", function() {
  set(adapter, 'namespace', 'codecamp');
  person = store.find(Person, 1);
  expectUrl("/codecamp/people/1", "the namespace, followed by by the plural of the model name and the id");
});

test("creating an item with a belongsTo relationship urlifies the Resource URI (default key)", function() {
  store.load(Person, {id: 1, name: "Maurice Moss"});
  person = store.find(Person, 1);

  expectState('new', false);
  expectState('loaded');
  expectState('dirty', false);

  task = Task.createRecord({name: "Get a bike!"});

  expectState('new', true, task);
  expectState('dirty', true, task);

  set(task, 'owner', person);

  store.commit();

  expectUrl('/owners/1/tasks/', 'create URL');
  expectType("POST");
  expectData({ name: "Get a bike!", owner: "1"});

  ajaxHash.success({ id: 1, name: "Get a bike!", owner_id: "/people/1"}, Task);

});

test("creating an item with a belongsTo relationship urlifies the Resource URI (custom key)", function() {

  var adapter, Adapter, task;

  Adapter = DS.DjangoRESTAdapter.extend({
    ajax: function(url, type, hash) {
      var success = hash.success, self = this;

      ajaxUrl = url;
      ajaxType = type;
      ajaxHash = hash;

      if (success) {
        hash.success = function(json, type) {
          success.call(self, json);
        };
      }
    }

  });

  Adapter.map('Task', {
    owner: {key: 'owner_custom_key'}
  });

  adapter = Adapter.create();
  store.set('adapter', adapter);

  store.load(Person, {id: 1, name: "Maurice Moss"});
  person = store.find(Person, 1);

  task = Task.createRecord({name: "Get a bike!"});

  task.set('owner', person);

  store.commit();

  expectUrl('/owners/1/tasks/', 'create URL');
  expectType("POST");
  expectData({ name: "Get a bike!", owner_custom_key: "1"});

  ajaxHash.success({ id: 1, name: "Get a bike!", owner: "/people/1"}, Task);

});

test("creating an item and adding hasMany relationships parses the Resource URI (default key)", function() {

  Person = DS.Model.extend({
    name: DS.attr('string'),
    group: DS.belongsTo('Group')
  });
  Person.toString = function() {
    return "Person";
  };

  equal(true, true);
  store.load(Person, {id: 1, name: "Maurice Moss"});
  store.load(Person, {id: 2, name: "Roy"});

  var moss = store.find(Person, 1);
  var roy = store.find(Person, 2);

  group = Group.createRecord({name: "Team"});

  store.commit();

  expectUrl('/groups', 'create Group URL');
  expectType("POST");
  expectData({name: "Team", people: [] });

  ajaxHash.success({ id: 1, name: "Team", people: [] }, Group);

  group = store.find(Group, 1);

  group.get('people').pushObject(moss);
  group.get('people').pushObject(roy);

  store.commit();

  // HasMany updates through the belongsTo component
  expectUrl('/people/2', 'modify Group URL');
  expectType("PUT");
  expectData({name: "Roy", group: '1' });

});

test("findMany generates a django-rest style url that requires the parent record", function() {
  var adapter = store.get('adapter');

  store.load(Person, {id: 1, name: "Maurice Moss"});
  store.load(Person, {id: 2, name: "Toran Billups"});
  var firstPerson = store.find(Person, 1);
  var lastPerson = store.find(Person, 2);

  store.load(Group, {id: 1, name: "Maurice Moss", people: [firstPerson, lastPerson]});
  var parent = store.find(Group, 1);

  adapter.findMany(store, Person, [1,2], parent);
  expectUrl("/groups/1/people/");
  expectType("GET");
});

test("finding many people by a list of IDs", function() {
  store.load(Group, { id: 1, people: [
    "/people/1",
    "/people/2",
    "/people/3"
  ]});

  var group = store.find(Group, 1);

  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  var people = get(group, 'people');

  equal(get(people, 'length'), 3, "there are three people in the association already");

  people.forEach(function(person) {
    equal(get(person, 'isLoaded'), false, "the person is being loaded");
  });

  expectUrl("/groups/1/people/");
  expectType("GET");

  ajaxHash.success({"objects":
    [
      { id: 1, name: "Rein Heinrichs" },
      { id: 2, name: "Tom Dale" },
      { id: 3, name: "Yehuda Katz" }
    ]}
  );

  //todo why are these objects empty when se use objectAt ?
  // var rein = people.objectAt(0);
  // equal(get(rein, 'name'), "Rein Heinrichs");
  // equal(get(rein, 'id'), 1);

  // var tom = people.objectAt(1);
  // equal(get(tom, 'name'), "Tom Dale");
  // equal(get(tom, 'id'), 2);

  // var yehuda = people.objectAt(2);
  // equal(get(yehuda, 'name'), "Yehuda Katz");
  // equal(get(yehuda, 'id'), 3);

  // people.forEach(function(person) {
  //   equal(get(person, 'isLoaded'), true, "the person is being loaded");
  // });
});
