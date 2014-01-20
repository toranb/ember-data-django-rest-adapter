# ember-data-django-rest-adapter 

[![Build Status](https://secure.travis-ci.org/toranb/ember-data-django-rest-adapter.png?branch=master)](https://travis-ci.org/toranb/ember-data-django-rest-adapter) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

<img src="badge@2x.png" width="130" height="30"> bower install ember-data-django-rest-adapter

## Install

    npm install bower
    bower install ember-data-django-rest-adapter
    add the following scripts to your application

    <script type="text/javascript" src="/bower_components/jquery/jquery.min.js"></script>
    <script type="text/javascript" src="/bower_components/handlebars/handlebars.js"></script>
    <script type="text/javascript" src="/bower_components/ember/ember.js"></script>
    <script type="text/javascript" src="/bower_components/ember-data/ember-data.js"></script>
    <script type="text/javascript" src="/bower_components/ember-data-django-rest-adapter/build/ember-data-django-rest-adapter.js"></script>

## Motivation
- The `django-rest-framework` is a great REST framework for python / django developers
- The default `ember-data` `RESTAdapter` does not follow the conventions used by the django rest framework

## Usage

#### Javascript side
- Include the `ember-data-django-rest-adapter.js` after `ember-data.js` in your HTML/build system

Basic code to use it with the last ember-data revision:

      App.ApplicationAdapter = DS.DjangoRESTAdapter.extend({});

Creating with a namespace (not to be confused with Django namespace urls) that will be used as the root url:

      App.ApplicationAdapter = DS.DjangoRESTAdapter.extend({
          namespace: 'codecamp'
      });

#### python/django side
This project requires the `django-rest-framework` 2.x branch (specifically 2.1.14 or newer)

i) The adapter assumes you have 2 different endpoints per django model

    class People(generics.ListCreateAPIView):
        model = Person
        serializer_class = PersonSerializer

    class Person(generics.RetrieveUpdateDestroyAPIView):
        model = Person
        serializer_class = PersonSerializer


ii) The above might have a `urls.py` something like the below

    urlpatterns = patterns('',
        url(r'^/people/(?P<pk>\d+)/$', Person.as_view()),
        url(r'^/people/$', People.as_view()),
    )


## Filtering Support
This adapter supports basic query string filtering

On the client side you would apply a filter using the `ember-data` find api (this returns an DS.AdapterPopulatedRecordArray)

    App.Person = DS.Model.extend({
        name: DS.attr('string')
    });
    var people = this.store.find('person', {name: 'Toran'});

On the server side you first need to add the `django-filter` dependency

    pip install django-filter

Next you need to add a setting to tell the `django-rest-framework` that you intend to use this dependency as your filter backend

    REST_FRAMEWORK = {
        'FILTER_BACKEND': 'rest_framework.filters.DjangoFilterBackend'
    }

Now you can apply the filter to your `ListAPIView` or `ListCreateAPIView`

    class People(generics.ListCreateAPIView):
        model = Person
        serializer_class = PersonSerializer
        filter_fields = ('name', )

If you have this setup correctly you should see an ajax request that looks something like the below

    http://localhost:8000/codecamp/people/?name=Toran

To learn more about the filtering options available in the django-rest-framework, please refer to the [api-guide][filtering]

[filtering]: http://django-rest-framework.org/api-guide/filtering.html#generic-filtering


## Record Nesting
When nesting resources, which is common in many-to-many or foreign-key relationships, the following conventions apply.

Nested endpoints must be list only.  Any nested resources must also have their own top level endpoints for create / update / delete

    class PeopleView(generics.ListCreateAPIView):
        ...
    
    class PersonView(generics.RetrieveUpdateDestroyAPIView):
        ...
    
    class NestedPeopleView(generics.ListAPIView):
        ...
    
    class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
        ...
    
    urlpatterns = patterns('',
        url(r'^/people/$', PeopleView.as_view()),
        url(r'^/people/(?P<pk>\d+)/$', PersonView.as_view()),
        url(r'^/groups/(?P<pk>\d+)/$', GroupDetailView.as_view()),
        url(r'^/groups/(?P<group_pk>\d+)/people/$', NestedPeopleView.as_view()),
    )

Nested endpoints must match their relation field name

    class Person(models.Model):
        name = models.CharField(...)
    
    class Group(models.Model):
        members = models.ManyToManyField(Person)
    
    urlpatterns = patterns('',
        #/groups/:id/people/ WILL NOT WORK
        url(r'^/groups/(?P<group_pk>\d+)/members/$', NestedPeopleView.as_view()),
    )

## CSRF Support
This adapter does not require you send a CSRF token with each $.ajax request

If you want to send the token with each request, add a snippet of javascript to ensure your application adds the csrf token to the http headers

    <script type="text/javascript">
      jQuery(document).ajaxSend(function(event, xhr, settings) {
        if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
          xhr.setRequestHeader("X-CSRFToken", "{{csrf_token}}");
        }
      });
    </script>

## Building ember-data-django-rest-adapter

To build the minified versions of ember-data-django-rest-adapter you will need [node.js](http://nodejs.org)

From the main project folder run the command below (This does not require `sudo`)

```shell
npm install
```

At this point the dependencies have been installed and you can build ember-data-django-rest-adapter

```shell
grunt
```

If you don't have all the node modules available on your path you can do this manually (ie- the grunt command does not work)

```shell
export PATH="./node_modules/.bin:$PATH"
```

## Integration with Ember App Kit

### Install manually

Using Ember Data Django REST Adapter with [Ember App Kit][] is easy!
Add the source file to the `/vendor/` directory, and add an exception to
`.gitignore`:

```
!/vendor/ember-data-django-rest-adapter.prod.js
```
### Install through bower

```
bower install --save ember-data-django-rest-adapter
```

### Configure

Then include the adapter in `app/index.html` somewhere after the
Ember Data include:

```html
<script src="/vendor/ember-data-django-rest-adapter.prod.js"></script>
```

Finally, initialize the adapter by replacing the contents of
`app/adapters/application.js` with:

```js
var AppAdapter = DS.DjangoRESTAdapter.extend();

export default AppAdapter;
```

And initialize the serializer by adding the file
`app/serializers/application.js` with the contents:

```js
var AppSerializer = DS.DjangoRESTSerializer.extend();

export default AppSerializer;
```

Your project will now use the Django REST Adapter.  If you are serving
your API on a separate domain (or even a separate PORT!) you will need
to configure this in the adapter instantiation—in
`app/adapters/application.js`.  For example:

```js
var AppAdapter = DS.DjangoRESTAdapter.extend({
  host: 'http://api.mydomain.com'
});

export default AppAdapter;
```

## Contributing
This adapter was built by the community for the community. If you would like to extend it or fix a bug, please open an issue or create a pull request. If you can provide a test case for the issue in question, it will help the core team solve the issue more quickly.

## Unit tests

    npm install
    grunt test

## Versions
    ember.js 1.4.0
    ember-data 1.0 beta 5

## Pending Issues

    i) Date and DateTime are not yet built into the adapter (see the WIP PR for a workaround)

    ii) Async belongsTo/hasMany requires a pull-request be merged into ember-data core (see the WIP branch for a workaround)

    iii) Pagination is not yet supported

## Examples
An example project that shows the adapter in action can be found below

https://github.com/toranb/complex-ember-data-example.git

## Credits
I took a large part of this project (including the motivation) from @escalant3 and his tastypie adapter

https://github.com/escalant3/ember-data-tastypie-adapter/

## License
Copyright © 2014 Toran Billups http://toranbillups.com

Licensed under the MIT License


[Ember App Kit]: https://github.com/stefanpenner/ember-app-kit

