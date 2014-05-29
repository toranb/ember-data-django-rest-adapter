
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
        // App.store = DS.Store.extend();
        // var store = TestStore.create();
        // console.log(store);
        var store = App.__container__.lookup('store:main');

        store.find('user', 1).then(function(user) {
            messages = user.get('messages').toArray();
            equal(messages.length, 2);
            console.log('3');
            store.unloadAll();
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

    Ember.run(App, function(){
        var store = App.__container__.lookup('store:main');

        store.find('user', 1).then(function(user) {
            equal(user.get('id'),1);
            console.log('1',user.get('messages'));
            user.get('messages').then(function(messages) {
                console.log('2');
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


// asyncTest('test async polymorphic belongsTo', function() {
// 	var message_json = {
// 		"id": 1,
// 		"content": "yo yo yo",
//         "author": 2,
//         "authorType": "company"
// 	};

//     var company_json = {
//         "id": 2,
//         "name": "Big corp"
//     }

//     stubEndpointForHttpRequest('/api/messages/1/', message_json);
//     stubEndpointForHttpRequest('/api/companies/2/', company_json);

//     Ember.run(App, function(){
//         var store = App.__container__.lookup('store:main');

//         store.find('message', 1).then(function(message) {
//             equal(message.get('content'),message_json.content);

//             message.get('author').then(function(author) {
//                 equal(author.get('name'),company_json.name);

//                 // tell QUnit to run tests again
//                 start();
//             });

//         });
//     });
// });

// asyncTest('test sideloaded async polymorphic belongsTo', function() {
//     var message_json = {
//         "id": 1,
//         "content": "yo yo yo",
//         "authorType": "company",
//         "author": {
//             "id": 2,
//             "name": "big corp"
//         }
//     };

//     stubEndpointForHttpRequest('/api/messages/1/', message_json);

//     Ember.run(App, function(){
//         var store = App.__container__.lookup('store:main');

//         store.find('message', 1).then(function(message) {
//             console.log('message',message);
//             equal(message.get('content'),message_json.content);

//             message.get('author').then(function(author) {
//                 equal(author.get('name'),message_json.author.name);

//                 // tell QUnit to run tests again
//                 start();
//             });

//         });
//     });
// });