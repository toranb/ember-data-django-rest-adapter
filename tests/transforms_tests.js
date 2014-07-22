module('transforms integration tests', {
  setup: function() {
    ajaxHash = null;
    App.reset();
  },
  teardown: function() {
    $.mockjaxClear();
  }
});

test('date attribute serializes properly', function() {
  stubEndpointForHttpRequest('/api/new-obituary', {}, 'POST', 201);
  visit('/new-obituary');
  fillIn('.publish-on', '2012/08/29');
  click('button.submit');

  andThen(function() {
    equal(
      ajaxHash.data,
      '{"publish_on":"2012-08-29","time_of_death":null}'
    );
  });
});

test('datetime attribute serializes properly', function() {
  stubEndpointForHttpRequest('/api/new-obituary', {}, 'POST', 201);
  visit('/new-obituary');
  fillIn('.time-of-death', '2014-11-19T17:38:00.000Z');
  click('button.submit');

  andThen(function() {
    equal(
      ajaxHash.data,
      '{"publish_on":null,"time_of_death":"2014-11-19T17:38:00.000Z"}'
    );
  });
});

test('date attribute deserializes properly', function() {
  var response = '[{"id":1,"publish_on":"2012-08-29","time_of_death":null}]';
  stubEndpointForHttpRequest('/api/obituaries/', response, 'GET', 200);
  visit('/obituaries/');

  andThen(function() {
    equal(find('.publish-on').text(), 'Wed, 29 Aug 2012 00:00:00 GMT');
  });
});

test('datetime attribute deserializes properly', function() {
  var response = '[{"id":1,"publish_on":null,"time_of_death":"2014-11-19T17:38:00.000Z"}]';
  stubEndpointForHttpRequest('/api/obituaries/', response, 'GET', 200);
  visit('/obituaries/');

  andThen(function() {
    equal(find('.time-of-death').text(), 'Wed, 19 Nov 2014 17:38:00 GMT');
  });
});
