module('polymorphic integration tests', {
    setup: function() {
        ajaxUrl = undefined;
        ajaxType = undefined;
        ajaxHash = undefined;
        App.reset();
    },
    teardown: function() {
        $.mockjaxClear();
    }
});

asyncTest('test polymorphic hasMany', function() {
    var json = {
        "id": 100,
        "username": "Paul",
        "messages": [
            {
                "id": 200,
                "type": "Post",
            },
            {
                "id": 300,
                "type": "Comment",
            }
        ]
    };

    stubEndpointForHttpRequest('/api/users/1/', json);

    Ember.run(App, function(){
        var store = App.__container__.lookup('store:main');

        store.find('user', 1).then(function(user) {
            messages = user.get('messages').toArray();
            equal(messages.length, 2);
            start();
        });
    });
});

asyncTest('test async polymorphic hasMany', function() {
    App.User.reopen({
        messages: DS.hasMany('message', { polymorphic: true, async: true })
    });

	var json = {
		"id": 1,
		"username": "Paul",
		"messages": [
			{
    			"id": 2,
    			"type": "Post",
			},
			{
    			"id": 3,
    			"type": "Comment",
			}
		]
	};

    stubEndpointForHttpRequest('/api/users/1/', json);

    App.reset();

    Ember.run(App, function(){
        var store = App.__container__.lookup('store:main');

        store.find('user', 1).then(function(user) {
            user.get('messages').then(function(messages) {
                equal(messages.toArray().length, 2);

                // Reset to async false
                App.User.reopen({
                    messages: DS.hasMany('message', { polymorphic: true })
                });

                start();
            });
        });
    });
});

asyncTest('test async polymorphic belongsTo', function() {
    App.Message.reopen({
        author: DS.belongsTo('author', { polymorphic: true, async: true })
    });

	var message_json = {
		"id": 1,
		"content": "yo yo yo",
        "author": 2,
        "authorType": "company"
	};

    var company_json = {
        "id": 2,
        "name": "Big corp"
    }

    stubEndpointForHttpRequest('/api/messages/1/', message_json);
    stubEndpointForHttpRequest('/api/companies/2/', company_json);

    App.reset();

    Ember.run(App, function(){
        var store = App.__container__.lookup('store:main');

        store.find('message', 1).then(function(message) {
            equal(message.get('content'),message_json.content);

            message.get('author').then(function(author) {
                equal(author.get('name'),company_json.name);

                App.User.reopen({
                    author: DS.belongsTo('author', { polymorphic: true })
                });

                // tell QUnit to run tests again
                start();
            });

        });
    });
});