module('polymorphic integration tests', {
  setup: function() {
    // TODO figure out why this isn't getting called
    ajaxUrl = undefined;
    ajaxType = undefined;
    ajaxHash = undefined;
    App.reset();
  },
  teardown: function() {
    $.mockjaxClear();

    DS.DjangoRESTSerializer.reopen({
      keyForType: function(key) {
        return key + "_type";
      },
      keyForEmbeddedType: function(key) {
        return 'type';
      }
    });
  }
});

asyncTest('test polymorphic hasMany', function() {
  var json = {
    "id": 100,
    "username": "Paul",
    "messages": [
      {
      "id": 101,
      "type": "post",
    },
    {
      "id": 102,
      "type": "comment",
    }
    ]
  };

  stubEndpointForHttpRequest('/api/users/100/', json);

  Ember.run(App, function(){
    var store = App.__container__.lookup('store:main');

    store.find('user', 100).then(function(user) {
      var messages = user.get('messages').toArray();
      equal(messages.length, 2);
      start();
    });
  });
});

asyncTest('test async polymorphic hasMany', function() {
  App.reset();

  App.User.reopen({
    messages: DS.hasMany('message', { polymorphic: true, inverse: 'author', async: true })
  });

  var json = {
    "id": 200,
    "username": "Paul",
    "messages": [
      {
      "id": 201,
      "type": "post",
    },
    {
      "id": 202,
      "type": "comment",
    }
    ]
  };

  stubEndpointForHttpRequest('/api/users/200/', json);

  Ember.run(App, function(){
    var store = App.__container__.lookup('store:main');

    store.find('user', 200).then(function(user) {
      user.get('messages').then(function(messages) {
        equal(messages.toArray().length, 2);

        App.User.reopen({
          messages: DS.hasMany('message', { polymorphic: true, inverse: 'author' })
        });

        start();
      });
    });
  });
});

asyncTest('test polymorphic belongsTo', function() {
  App.reset();

  var message_json = {
    "id": 300,
    "content": "yo yo yo",
    "author": {
      "id": 301,
      "name": "website",
      "type": "company"
    }
  };

  stubEndpointForHttpRequest('/api/messages/300/', message_json);

  Ember.run(App, function(){
    var store = App.__container__.lookup('store:main');

    store.find('message', 300).then(function(message) {
      var author = message.get('author');

      equal(author.get('name'),message_json.author.name);

      start();
    });
  });
});

asyncTest('test async polymorphic belongsTo', function() {
  App.reset();

  App.Message.reopen({
    author: DS.belongsTo('author', { polymorphic: true, async: true })
  });

  var message_json = {
    "id": 400,
    "content": "yo yo yo",
    "author": 401,
    "author_type": "company"
  };

  var company_json = {
    "id": 401,
    "name": "Big corp"
  }

  stubEndpointForHttpRequest('/api/messages/400/', message_json);
  stubEndpointForHttpRequest('/api/companies/401/', company_json);

  Ember.run(App, function(){
    var store = App.__container__.lookup('store:main');

    store.find('message', 400).then(function(message) {
      equal(message.get('content'),message_json.content);

      message.get('author').then(function(author) {
        equal(author.get('name'),company_json.name);

        App.User.reopen({
          author: DS.belongsTo('author', { polymorphic: true })
        });

        start();
      });

    });
  });
});

asyncTest('test loading with custom key for polymorphic belongsTo', function() {
  App.reset();

  DS.DjangoRESTSerializer.reopen({
    keyForEmbeddedType: function(key) {
      return 'custom_type';
    }
  });

  var message_json = {
    "id": 500,
    "content": "yo yo yo",
    "receiver": {
      "id": 501,
      "name": "website",
      "custom_type": "company"
    }
  };

  var second_message_json = {
    "id": 502,
    "content": "yo yo yo",
    "receiver": {
      "id": 501,
      "name": "website",
      "custom_type": "company"
    }
  };

  stubEndpointForHttpRequest('/api/messages/500/', message_json);
  stubEndpointForHttpRequest('/api/messages/502/', second_message_json);

  Ember.run(function(){
    var store = App.__container__.lookup('store:main');

    store.find('message', 500).then(function(message) {
      var receiver = message.get('receiver');

      equal(receiver.get('name'),message_json.receiver.name);

      store.find('message', 502).then(function(message) {
        equal(receiver.get('name'),message_json.receiver.name);

        DS.DjangoRESTSerializer.reopen({
          keyForEmbeddedType: function(key) {
            return 'type';
          }
        });

        start();
      });

    });
  });
});

asyncTest('test serializing with custom key for polymorphic belongsTo', function() {
  App.reset();

  DS.DjangoRESTSerializer.reopen({
    keyForType: function(key) {
      return key + "_custom_type";
    },
    keyForEmbeddedType: function(key) {
      return 'custom_type';
    }
  });

  var message_json = {
    "id": 600,
    "content": "yo yo yo",
    "receiver": {
      "id": 601,
      "name": "website",
      "custom_type": "company"
    }
  };

  stubEndpointForHttpRequest('/api/messages/600/', message_json);

  Ember.run(function(){
    var store = App.__container__.lookup('store:main');

    store.find('message', 600).then(function(message) {
      var serialized = store.serialize(message, {includeId: true});
      equal(serialized.receiver, 601);
      equal(serialized.receiver_custom_type, 'company');

      DS.DjangoRESTSerializer.reopen({
        keyForType: function(key) {
          return key + "_type";
        },
        keyForEmbeddedType: function(key) {
          return 'type';
        }
      });

      start();
    });
  });
});

asyncTest('should not serialize polymorphic hasMany associations', function() {
  App.reset();

  var json = {
    "id": 700,
    "name": "Paul",
    "username": "Paul",
    "messages": [
      {
      "id": 701,
      "type": "post",
    }
    ]
  };

  stubEndpointForHttpRequest('/api/users/700/', json);

  Ember.run(App, function(){
    var store = App.__container__.lookup('store:main');

    store.find('user', 700).then(function(user) {
      var serialized = store.serialize(user);

      deepEqual(serialized,{name: "Paul", username: "Paul"});

      start();
    });
  });
});

asyncTest('test custom key for polymorphic hasMany', function() {
  DS.DjangoRESTSerializer.reopen({
    keyForEmbeddedType: function(key) {
      return 'custom_type';
    }
  });

  App.reset();

  var json = {
    "id": 800,
    "username": "Paul",
    "messages": [
      {
      "id": 801,
      "custom_type": "post",
      "content": "I am a message"
    }
    ]
  };

  stubEndpointForHttpRequest('/api/users/800/', json);

  Ember.run(function(){
    var store = App.__container__.lookup('store:main');

    store.find('user', 800).then(function(user) {
      var messages = user.get('messages').toArray();
      var message = messages[0];

      equal(message.content,json["messages"]["content"]);

      DS.DjangoRESTSerializer.reopen({
        keyForEmbeddedType: function(key) {
          return 'type';
        }
      });

      start();
    });
  });
});
