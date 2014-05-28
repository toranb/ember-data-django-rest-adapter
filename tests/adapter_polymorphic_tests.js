
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

// test('ajax response with array of polymorphic records renders hasMany correctly', function() {
// 		var json = {
// 			"id": 1,
// 			"username": "Paul",
// 			"messages": [
// 				{
// 				"id": 2,
// 				"type": "Post",
// 				"content": "Foo"
// 				},
// 				{
// 				"id": 3,
// 				"type": "Comment",
// 				"content": "Bar"
// 				}
// 			]
// 		};

//     stubEndpointForHttpRequest('/api/users/1/', json);
//     visit("/messages").then(function() {
//       var count = Ember.$("#messages li").length;
//       equal(count, json.messages.length, "count was instead: " + count);

//       var messageContents = [];

//       Ember.$("#messages li").each(function() {
//       	messageContents.push(Ember.$.trim($(this).text()));
//       });

//       equal(messageContents[0], 'Foo');
//       equal(messageContents[1], 'Bar');
//     });
// });


test('ajax response with polymorphic record renders belongsTo correctly', function() {
		var json = {
			"id": 1,
			"content": "yo yo yo",
			"author": {
				"type": "company",
				"name": "hi",
				"id": 2
			}
		};

    stubEndpointForHttpRequest('/api/messages/1/', json);
    visit("/message/1").then(function() {
    	console.log(Ember.$('#message-user').text());
    });
});