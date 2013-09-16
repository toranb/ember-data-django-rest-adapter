module('embedded integration tests', {
    setup: function() {
        Ember.run(function() {
            App.reset();
            App.deferReadiness();
        });
        stubEndpointForHttpRequest('/api/sessions/', []);
        Ember.run(App, 'advanceReadiness');
    },
    teardown: function() {
        $.mockjaxClear();
    }
});

test('ajax response with embedded hasMany renders correctly', function() {
    var json = [{"id": 1, "hat": "zzz", "speakers": [{"id": 1, "name": "first", "other": 1}], "ratings": [{"id": 1, "score": 10, "feedback": "nice", "other": 1}], "tags": [{"id": 1, "description": "done"}]}];
    stubEndpointForHttpRequest('/api/others/', json);
    visit("/others").then(function() {
        var rows = find("table tr").length;
        equal(rows, 3, "table had " + rows + " rows");
        var hat = $("table tr:eq(0) td:eq(0)").text();
        var speaker = $("table tr:eq(1) td:eq(0)").text();
        var rating = $("table tr:eq(2) td:eq(0)").text();
        equal(hat, "zzz", "(other) hat was instead: " + hat);
        equal(speaker, "first", "speaker was instead: " + speaker);
        equal(rating, "10", "rating was instead: " + rating);
    });
});

test('ajax response with no embedded records yields empty table', function() {
    stubEndpointForHttpRequest('/api/others/', []);
    visit("/others").then(function() {
        var rows = find("table tr").length;
        equal(rows, 0, "table had " + rows + " rows");
    });
});
