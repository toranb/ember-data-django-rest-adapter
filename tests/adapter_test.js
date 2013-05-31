var get = Ember.get, set = Ember.set;

var ajaxUrl, ajaxType, ajaxHash;
var Person, person, people;
var Role, role, roles;
var Group, group;
var Task, task;
var User, user;

var REVISION = 12;

DS.DjangoRESTAdapter.configure("plurals", {"person" : "people"});

var TestAdapter = DS.DjangoRESTAdapter.extend({
  ajax: function(url, type, hash) {
    var success = hash.success, error = hash.error, adapter = this;

    ajaxUrl = url;
    ajaxType = type;
    ajaxHash = hash;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      hash.success = function(json) {
        resolve.call(adapter, json);
      };
      hash.error = function(jqXHR, textStatus, errorThrown) {
        reject.call(adapter, reject, jqXHR);
      };
    });
  }
});

var store = DS.Store.create({
  adapter: TestAdapter
});

module("DjangoRESTAdapter", {
  setup: function() {
    ajaxUrl = undefined;
    ajaxType = undefined;
    ajaxHash = undefined;

    var attr = DS.attr, hasMany = DS.hasMany, belongsTo = DS.belongsTo;
    Person = DS.Model.extend({
      name: attr('string')
    });

    Group = DS.Model.extend({
      name: attr('string'),
      people: hasMany(Person)
    });

    Role = DS.Model.extend({
      name: attr('string')
    });

    Task = DS.Model.extend({
      name: attr('string'),
      isFinished: attr('boolean'),
      owner: belongsTo(Person)
    });

    User = DS.Model.extend({
      username: attr('string')
    });

    Person.reopen({
      tasks: hasMany(Task)
    });

    Person.toString = function() {
      return "App.Person";
    };

    User.toString = function() {
      return "App.User";
    };

    Role.toString = function() {
      return "App.Role";
    };

    Group.toString = function() {
      return "App.Group";
    };

    Task.toString = function() {
      return "App.Task";
    };

  },

  teardown: function() {
    if (person) {
        person.destroy();
    }
    person = null;
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

var expectStateForInstance = function(state, value, model) {
  var flag = "is" + state.charAt(0).toUpperCase() + state.substr(1);
  equal(get(model, flag), value, "the model is " + (value === false ? "not " : "") + state);
};

var expectUrlTypeData = function(url, desc, type, hash) {
  expectUrl(url, desc);
  expectType(type);
  expectData(hash);
};

var expectLoaded = function(model) {
  expectStateForInstance('new', false, model);
  expectStateForInstance('loaded', true, model);
  expectStateForInstance('dirty', false, model);
};

var expectNew = function(model) {
  expectStateForInstance('new', true, model);
  expectStateForInstance('dirty', true, model);
};

var commit = function() {
  Ember.run(function() {
    store.commit();
  });
};

var ajax = function(hash) {
  Ember.run(function() {
    ajaxHash.success(hash);
  });
};

test("creating a role makes a POST to /roles/ with the data hash", function() {
  role = store.createRecord(Role, { name: "Admin" });

  expectStateForInstance('new', true, role);
  commit();
  expectStateForInstance('saving', true, role);

  expectUrl("/roles/", "the url should be the plural of the model name");
  expectType("POST");
  expectData({ name: "Admin" });

  ajax({ id: 1, name: "Admin" });
  expectStateForInstance('saving', false, role);

  result = store.find(Role, 1);
  equal(result.get('name'), "Admin", "it should now possible to retrieve the role by the id supplied");
});

test("updating a role makes a PUT to /roles/:id/ with the data hash", function() {
  store.load(Role, { id: 1, name: "Admin" });
  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  role = store.find(Role, 1);
  expectLoaded(role);

  set(role, 'name', "Developer");

  expectStateForInstance('dirty', true, role);
  commit();
  expectStateForInstance('saving', true, role);

  expectUrl("/roles/1/", "the plural of the model name with its id");
  expectType("PUT");

  ajax({ id: 1, name: "Developer" });
  expectStateForInstance('saving', false, role);

  result = store.find(Role, 1);

  equal(get(result, 'name'), "Developer", "the hash should be updated");
});

test("deleting a role makes a DELETE to /roles/:id/", function() {
  store.load(Role, { id: 1, name: "Admin" });
  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  role = store.find(Role, 1);

  expectLoaded(role);

  role.deleteRecord();

  expectStateForInstance('dirty', true, role);
  expectStateForInstance('deleted', true, role);
  commit();
  expectStateForInstance('saving', true, role);

  expectUrl("/roles/1/", "the plural of the model name with its id");
  expectType("DELETE");

  expectStateForInstance('deleted', true, role);
});

test("finding a role by ID makes a GET to /roles/:id/", function() {
  role = store.find(Role, 1);

  expectStateForInstance('loaded', false, role);
  expectUrl("/roles/1/", "the plural of the model name with the id requested");
  expectType("GET");

  ajax({ id: 1, name: "Admin" });

  expectLoaded(role);

  equal(role, store.find(Role, 1), "the record is now in the store, and can be looked up by id without another Ajax request");
});

test("creating a task with only user results in http post to nested endpoint under users", function() {
  Task.reopen({
    zidentity: DS.belongsTo(User)
  });

  store.load(User, {id: 9, username: "admin"});
  user = store.find(User, 9);
  expectLoaded(user);

  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  task = Task.createRecord({name: "Todo", zidentity: user});
  expectNew(task);

  commit();

  expectUrlTypeData('/users/9/tasks/', 'create URL', 'POST', { name: "Todo", is_finished: false, zidentity: "9" });

  ajax({ id: 1, name: "Todo", zidentity: 9 }, Task);
  expectLoaded(task);
});

test("creating a task with only person results in http post to nested endpoint under people", function() {
  Task.reopen({
    zidentity: DS.belongsTo(User)
  });

  store.load(Person, {id: 2, name: "Toran Billups"});
  person = store.find(Person, 2);
  expectLoaded(person);

  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  task = Task.createRecord({name: "Todo", owner: person});
  expectNew(task);

  commit();

  expectUrlTypeData('/people/2/tasks/', 'create URL', 'POST', { name: "Todo", is_finished: false, owner: "2" });

  ajax({ id: 1, name: "Todo", owner: 2 }, Task);
  expectLoaded(task);
});

test("creating a task with only person when model has a single belongsTo results in http post to nested endpoint", function() {
  store.load(Person, {id: 2, name: "Toran Billups"});
  person = store.find(Person, 2);
  expectLoaded(person);

  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  task = Task.createRecord({name: "Todo", owner: person});
  expectNew(task);

  commit();

  expectUrlTypeData('/people/2/tasks/', 'create URL', 'POST', { name: "Todo", is_finished: false, owner: "2" });

  ajax({ id: 1, name: "Todo", owner: 2 }, Task);
  expectLoaded(task);
});

test("creating a task with both person and user results in http post to non-nested endpoint", function() {
  Task.reopen({
    zidentity: DS.belongsTo(User)
  });

  store.load(User, {id: 9, username: "admin"});
  store.load(Person, {id: 2, name: "Toran Billups"});
  user = store.find(User, 9);
  person = store.find(Person, 2);
  expectLoaded(user);
  expectLoaded(person);

  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  task = Task.createRecord({name: "Todo", owner: person, zidentity: user});
  expectNew(task);

  commit();

  expectUrlTypeData('/tasks/', 'create URL', 'POST', { name: "Todo", is_finished: false, owner: "2", zidentity: "9" });

  ajax({ id: 1, name: "Todo", owner: 2, zidentity: 9 }, Task);
  expectLoaded(task);
});

test("creating a task without person and user results in http post to non-nested endpoint", function() {
  Task.reopen({
    zidentity: DS.belongsTo(User)
  });

  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  task = Task.createRecord({name: "Todo"});
  expectNew(task);

  commit();

  expectUrlTypeData('/tasks/', 'create URL', 'POST', { name: "Todo", is_finished: false });

  ajax({ id: 1, name: "Todo" }, Task);
  expectLoaded(task);
});

test("creating a person makes a POST to /people/ with the data hash", function() {
  person = store.createRecord(Person, { name: "Toran" });

  expectStateForInstance('new', true, person);
  commit();
  expectStateForInstance('saving', true, person);

  expectUrl("/people/", "the url should be the plural of the model name");
  expectType("POST");
  expectData({ name: "Toran" });

  ajax({ id: 1, name: "Toran", tasks: [] });
  expectStateForInstance('saving', false, person);

  result = store.find(Person, 1);
  equal(result.get('name'), "Toran", "it should now possible to retrieve the person by the id supplied");
});

test("updating a person makes a PUT to /people/:id/ with the data hash", function() {
  store.load(Person, { id: 1, name: "Toran" });
  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  person = store.find(Person, 1);
  expectLoaded(person);

  set(person, 'name', "Joel");

  expectStateForInstance('dirty', true, person);
  commit();
  expectStateForInstance('saving', true, person);

  expectUrl("/people/1/", "the plural of the model name with its id");
  expectType("PUT");

  ajax({ id: 1, name: "Joel", tasks: [] });
  expectStateForInstance('saving', false, person);

  result = store.find(Person, 1);

  equal(get(result, 'name'), "Joel", "the hash should be updated");
});

test("deleting a person makes a DELETE to /people/:id/", function() {
  store.load(Person, { id: 1, name: "Toran" });
  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  person = store.find(Person, 1);

  expectLoaded(person);

  person.deleteRecord();

  expectStateForInstance('dirty', true, person);
  expectStateForInstance('deleted', true, person);
  commit();
  expectStateForInstance('saving', true, person);

  expectUrl("/people/1/", "the plural of the model name with its id"); //add trailing slash
  expectType("DELETE");

  expectStateForInstance('deleted', true, person);
});

test("finding a person by id makes a GET to /people/:id/", function() {
  person = store.find(Person, 1);

  expectStateForInstance('loaded', false, person);
  expectUrl("/people/1/", "the plural of the model name with the id requested"); //add slash
  expectType("GET");

  ajax({ id: 1, name: "Toran", tasks: [] });

  expectLoaded(person);
  equal(person, store.find(Person, 1), "the record is now in the store, and can be looked up by id without another Ajax request");
});

test("finding all people makes a GET to /people/", function() {
  store.load(Person, {id: 2, name: "Toran", tasks: []});
  store.load(Person, {id: 3, name: "Joel", tasks: []});

  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  people = store.find(Person);
  equal(get(people, 'length'), 2, "there are two people");

  expectUrl("/people/", "the plural of the model");
  expectType("GET");
});

test("finding a person by name uses findQuery", function() {
  store.load(Person, {id: 2, name: "Toran", tasks: []});
  store.load(Person, {id: 3, name: "Joel", tasks: []});

  people = store.find(Person, {name: 'Toran'});

  expectUrl("/people/", "object name plural");
  expectData({name: 'Toran'});
  expectType("GET");
});

test("findMany generates http get request to fetch one-to-many relationship with the correct url", function() {
  store.load(Person, {id: 9, name: "Toran Billups", tasks: [1, 2]});
  person = store.find(Person, 9);
  expectLoaded(person);

  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  var tasks = get(person, 'tasks');

  equal(get(tasks, 'length'), 2, "there are two tasks in the association already");
  tasks.forEach(function(task) {
    equal(get(task, 'isLoaded'), false, "the task is being loaded");
  });

  expectUrl("/people/9/tasks/");
  expectType("GET");

  ajax([{"id": 1, "name": "Todo", "person": 9}, {"id": 2, "name": "Done", "person": 9}]);

  equal(get(tasks, 'length'), 2, "there are still two tasks in the association");
  tasks.forEach(function(task) {
    expectLoaded(task);
  });
  equal(get(tasks.objectAt(0), 'name'), 'Todo');
  equal(get(tasks.objectAt(1), 'name'), 'Done');
});

test("findMany generates http get request to fetch m2m relationship with the correct url", function() {
  store.load(Group, {id: 9, name: "Admin", people: [1,2,3]});
  group = store.find(Group, 9);
  expectLoaded(group);

  equal(ajaxUrl, undefined, "no Ajax calls have been made yet");

  var people = get(group, 'people');

  equal(get(people, 'length'), 3, "there are three people in the association already");
  people.forEach(function(person) {
    equal(get(person, 'isLoaded'), false, "the person is being loaded");
  });

  expectUrl("/groups/9/people/");
  expectType("GET");

  ajax([{"id": 1, "name": "Toran"}, {"id": 2, "name": "Joel"}, {"id": 3, "name": "Matt"}]);

  equal(get(people, 'length'), 3, "there are still three people in the association");
  people.forEach(function(person) {
    expectLoaded(person);
  });
  equal(get(people.objectAt(0), 'name'), 'Toran');
  equal(get(people.objectAt(1), 'name'), 'Joel');
  equal(get(people.objectAt(2), 'name'), 'Matt');
});

test("if you set a namespace then it will be prepended", function() {
  var test_adapter = TestAdapter.create();
  set(test_adapter, 'namespace', 'codecamp');
  fake_store = DS.Store.create({
    adapter: test_adapter
  });
  role = fake_store.createRecord(Role, { name: "Admin" });
  Ember.run(function() {
    fake_store.commit();
  });
  expectUrl("/codecamp/roles/", "the namespace, followed by by the plural of the model name");
});

test('serializer returns plural key without suffix for keyForHasMany method', function() {
  var serializer = DS.DjangoRESTSerializer.create();
  var type = Person;
  var name = 'tasks';
  var key = serializer.keyForHasMany(type, name);
  equal(key, 'tasks');
});

test('getTypeForModel returns the objects type as a string', function() {
  var test_adapter = TestAdapter.create();
  set(test_adapter, 'namespace', 'codecamp');
  fake_store = DS.Store.create({
    adapter: test_adapter
  });
  fake_store.load(Person, {id: 9, name: "Toran Billups"});
  person = fake_store.find(Person, 9);
  equal('App.Person', test_adapter.getTypeForModel(person));
});

test('serializer returns singular key without suffix for keyForBelongsTo method', function() {
  var serializer = DS.DjangoRESTSerializer.create();
  var type = Person;
  var name = 'task';
  var key = serializer.keyForBelongsTo(type, name);
  equal(key, 'task');
});

test('serializer adds parent_key and parent_value during addBelongsTo method', function() {
  store.load(Person, {id: 9, name: "Toran Billups"});
  store.load(Task, {id: 1, name: "Todo", owner: 9});
  var serializer = DS.DjangoRESTSerializer.create();
  var hash = {};
  var key = 'owner';
  var type = Person;
  var relationship = {key:key, type:type};
  var record = store.find(Task, 1);
  serializer.addBelongsTo(hash, record, key, relationship);
  equal(record.parent_type, type);
  equal(record.parent_value, 9);
  equal(hash.owner, 9);
});

test('ajax request made with cache set to false for ie users', function () {
  var options = null;
  jQuery.ajax = function (hash) {
      options = hash;
  };
  adapter = DS.DjangoRESTAdapter.create();
  adapter.ajax('/some/url/', 'GET', {'foo':'bar'});
  equal(options.url, '/some/url/');
  equal(options.type, 'GET');
  equal(options.dataType, 'json');
  equal(options.foo, 'bar');
  equal(options.cache, false);
});

// test('validation errors should invalidate object on HTTP 400', function() {
//   task = store.createRecord(Task);

//   expectStateForInstance('new', true, task);
//   store.commit();
//   expectStateForInstance('saving', true, task);

//   ajaxHash.status = 400;
//   ajaxHash.error({status: 400, responseText: '{"owner": ["Required"],' +
//                                              ' "is_finished": ["Only finished tasks allowed"],' +
//                                              ' "name": ["Required"]}'});
//   expectStateForInstance('valid', false, task);
//   equal(task.get('stateManager.currentPath'), 'rootState.loaded.created.invalid', 'the model is in state invalid');

//   deepEqual(task.get('errors'), {
//     isFinished: ['Only finished tasks allowed'],
//     name: ['Required'],
//     owner: ['Required']
//   }, 'the model contains the errors');
// });
