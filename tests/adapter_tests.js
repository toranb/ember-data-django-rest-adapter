var speakers_json, ratings_json, tags_json;

module('integration tests', {
    setup: function() {
        speakers_json = [{"id": 9, "name": "first", "session": 1}, {"id": 4, "name": "last", "session": 1}];
        ratings_json = [{"id": 8, "score": 10, "feedback": "nice", "session": 1}];
        tags_json = [{"id": 7, "description": "done"}];
        Ember.run(function() {
            App.reset();
            App.deferReadiness();
        });
    },
    teardown: function() {
        $.mockjaxClear();
    }
});

test('ajax response with 1 session yields table with 1 row', function() {
    var json = [{"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [], "ratings": [], "tags": []}];
    stubEndpointForHttpRequest('/api/sessions/', json);
    Ember.run(App, 'advanceReadiness');
    visit("/").then(function() {
        var rows = find("table tr").length;
        equal(rows, 6, "table had " + rows + " rows");
        var name = $("table td.name").text().trim();
        equal(name, "foo", "name was instead: " + name);
    });
});

test('ajax response with no session records yields empty table', function() {
    stubEndpointForHttpRequest('/api/sessions/', []);
    Ember.run(App, 'advanceReadiness');
    visit("/").then(function() {
        var rows = find("table tr").length;
        equal(rows, 0, "table had " + rows + " rows");
    });
});

test('ajax response with async hasMany relationship renders correctly', function() {
    stubEndpointForHttpRequest('/api/sessions/1/speakers/', speakers_json);
    stubEndpointForHttpRequest('/api/sessions/1/ratings/', ratings_json);
    stubEndpointForHttpRequest('/api/sessions/1/tags/', tags_json);
    var json = [{"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]}];
    stubEndpointForHttpRequest('/api/sessions/', json);
    Ember.run(App, 'advanceReadiness');
    visit("/").then(function() {
        //speakers
        var speakers = find("table td.speaker").length;
        equal(speakers, 2, "table had " + speakers + " speakers");
        var speaker_one = $("table td.speaker:eq(0)").text().trim();
        equal(speaker_one, "first", "speaker_one was instead: " + speaker_one);
        var speaker_two = $("table td.speaker:eq(1)").text().trim();
        equal(speaker_two, "last", "speaker_two was instead: " + speaker_two);
        //ratings
        var ratings = find("table td.rating").length;
        equal(ratings, 1, "table had " + ratings + " ratings");
        var rating_one = $("table td.rating:eq(0)").text().trim();
        equal(rating_one, "10", "rating_one was instead: " + rating_one);
        //tags
        var tags = find("table td.tag").length;
        equal(tags, 1, "table had " + tags + " tags");
        var tag_one = $("table td.tag:eq(0)").text().trim();
        equal(tag_one, "done", "tag_one was instead: " + tag_one);
    });
});

test('ajax response for single session will render correctly', function() {
    stubEndpointForHttpRequest('/api/sessions/1/speakers/', speakers_json);
    stubEndpointForHttpRequest('/api/sessions/1/ratings/', ratings_json);
    stubEndpointForHttpRequest('/api/sessions/1/tags/', tags_json);
    var json = {"id": 1, "name": "foo", "room": "bar", "desc": "test", "speakers": [9,4], "ratings": [8], "tags": [7]};
    stubEndpointForHttpRequest('/api/sessions/', [json]);
    stubEndpointForHttpRequest('/api/sessions/1/', json);
    Ember.run(App, 'advanceReadiness');
    visit("/session/1").then(function() {
        var name = $("div .model_name").text().trim();
        equal(name, "foo", "name was instead: " + name);
        //speakers
        var speakers = find("div .speakers span.name").length;
        equal(speakers, 2, "template had " + speakers + " speakers");
        var speaker_one = $("div .speakers span.name:eq(0)").text().trim();
        equal(speaker_one, "first", "speaker_one was instead: " + speaker_one);
        var speaker_two = $("div .speakers span.name:eq(1)").text().trim();
        equal(speaker_two, "last", "speaker_two was instead: " + speaker_two);
        //ratings
        var ratings = find("div .ratings span.score").length;
        equal(ratings, 1, "table had " + ratings + " ratings");
        var rating_one = $("div .ratings span.score:eq(0)").text().trim();
        equal(rating_one, "10", "rating_one was instead: " + rating_one);
        //setup the http post mock $.ajax
        //for some reason the 2 lines below are not used or needed?
        var response = {"id": 3, "score": 2, "feedback": "abc", "session": 1};
        stubEndpointForHttpRequest('/api/sessions/1/ratings/', response, 'POST');
        fillIn(".score", "2");
        fillIn(".feedback", "abc");
        return click(".add_rating");
    }).then(function() {
        //this is currently broken for non-embedded bound templates (should be 2)
        var ratings = find("div .ratings span.score").length;
        equal(ratings, 1, "table had " + ratings + " ratings");
    });
});
