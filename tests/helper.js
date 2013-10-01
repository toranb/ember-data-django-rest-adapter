document.write('<div id="ember-testing-container"><div id="ember-testing"></div></div>');

App.rootElement = '#ember-testing';
App.setupForTesting();
App.injectTestHelpers();

function exists(selector) {
    return !!find(selector).length;
}

function missing(selector) {
    var error = "element " + selector + " found (should be missing)";
    var element = find(selector).length;
    equal(element, 0, error);
}

var expectUrlTypeHashEqual = function(url, type, hash) {
    equal(ajaxUrl, url, "ajaxUrl was instead " + ajaxUrl);
    equal(ajaxType, type, "ajaxType was instead " + ajaxType);
    //hangs test runner? equal(ajaxHash, type, "ajaxHash was instead " + ajaxHash);
};

var expectSpeakerAddedToStore = function(pk, expectedName, expectedLocation) {
    Ember.run(App, function(){
        var store = App.__container__.lookup("store:main");
        store.find('speaker', pk).then(function(speaker) {
            var name = speaker.get('name');
            equal(name, expectedName, "speaker added with name " + name);
            var location = speaker.get('location');
            equal(location, expectedLocation, "speaker added with location " + location);
        });
    });
};

var expectRatingAddedToStore = function(pk, expectedScore, expectedFeedback, expectedParent, parentName) {
    if (parentName == null) {
        parentName = "session";
    }
    Ember.run(App, function(){
        var store = App.__container__.lookup("store:main");
        store.find('rating', pk).then(function(rating) {
            var primaryKey = rating.get('id');
            equal(primaryKey, pk, "rating added with id " + primaryKey);
            var score = rating.get('score');
            equal(score, expectedScore, "rating added with score " + score);
            var feedback = rating.get('feedback');
            equal(feedback, expectedFeedback, "rating added with feedback " + feedback);
            var parentpk = rating.get(parentName).get('id');
            equal(parentpk, expectedParent, "rating added with parent pk " + parentpk);
        });
    });
};

function stubEndpointForHttpRequest(url, json, verb, status) {
    if (verb == null) {
        verb = "GET";
    }
    if (status == null) {
        status = 200;
    }
    $.mockjax({
        type: verb,
        url: url,
        status: status,
        dataType: 'json',
        responseText: json
    });
}

$.mockjaxSettings.logging = false;
$.mockjaxSettings.responseTime = 0;
