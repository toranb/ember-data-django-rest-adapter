# ember-data-django-rest-adapter [![Build Status](https://secure.travis-ci.org/toranb/ember-data-django-rest-adapter.png?branch=master)](https://travis-ci.org/toranb/ember-data-django-rest-adapter)

## Motivation
- The django-rest-framework is a great REST framework for python / django developers
- The default ember-data RESTAdapter does not follow the conventions used by the django rest framework


## Usage

#### Javascript side

- You can either:
  - import the lib/serializer.js and lib/adapter.js files, or
  - use the ember-data-django-rest-adapter package on your build process.
  or
  - use dist/adapter.js after running `bundle && bundle exec rakep build` or simply `rake dist`

- To use the adapter with your store:

Basic code to use it with the last ember-data revision:

      App.Store = DS.DjangoRESTStore.extend({
        adapter: DS.DjangoRESTAdapter.create()
      });

Creating with a namespace (not to be confused with Django namespace urls) that will be used as the root url:

      App.Store = DS.DjangoRESTStore.extend({
        adapter: DS.DjangoRESTAdapter.create({
          namespace: "codecamp"
        })
      });

Creating with a custom plural dictionary that will be used when a custom plural is needed:

      DS.DjangoRESTAdapter.configure("plurals", {"person" : "people"});
      App.Store = DS.DjangoRESTStore.extend({
        adapter: DS.DjangoRESTAdapter.create()
      });


#### python/django side
This project requires the django-rest-framework 2.x branch (specifically 2.1.14 or newer)

i) The adapter assumes you have 2 different endpoints per django model

    class People(generics.ListCreateAPIView):
        model = Person
        serializer_class = PersonSerializer

    class Person(generics.RetrieveUpdateDestroyAPIView):
        model = Person
        serializer_class = PersonSerializer


ii) The above might have a urls.py something like the below

    urlpatterns = patterns('',
        url(r'^/people/(?P<pk>\d+)/$', Person.as_view()),
        url(r'^/people/$', People.as_view()),
    )


## Filtering Support
This adapter supports basic query string filtering

On the client side you would apply a filter using the ember-data find api (this returns an DS.AdapterPopulatedRecordArray)

	App.Person = DS.Model.extend({
	    name: DS.attr('string')
	});
	var people = App.Person.find({name: 'Toran'});

On the server side you first need to add the django-filter dependency

    pip install django-filter

Next you need to add a setting to tell the django-rest-framework that you intend to use this dependency as your filter backend

    REST_FRAMEWORK = {
        'FILTER_BACKEND': 'rest_framework.filters.DjangoFilterBackend'
    }

Now you can apply the filter to your ListAPIView or ListCreateAPIView

    class People(generics.ListCreateAPIView):
        model = Person
        serializer_class = PersonSerializer
        filter_fields = ['name']

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

If you want to send the token with each request, first add it to your html page as a meta tag

    <!-- inside our page's <head> tag -->
    <meta name="csrf-token" content="{{csrf_token}}">

Next you need to add a snippet of javascript to ensure your application adds the csrf token to the http headers

    <script type="text/javascript">
      jQuery(document).ajaxSend(function(event, xhr, settings) {
        if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
          var token = $('meta[name="csrf-token"]').attr('content');
          xhr.setRequestHeader("X-CSRFToken", token);
        }
      });
    </script>

## Contributing
This adapter may be useful for someone in the ember.js/django community. If you want to extend it, please open an issue or send a pull request.

## Unit tests

### Browser

    # run tests on http://localhost:9292/
    rackup

Go to http://localhost:9292/ to run the Qunit tests.

### Terminal (PhantomJS)

    # Run once
    rake test

    # Run continuosly listening for changes (OS X only)
    rake autotest

## Versions
    ember.js 1.0.0-RC.5
    ember-data v0.13

## Pending Issues
This adapter does not currently support the hypermedia side of the django-rest-framework. I believe another adapter that is hypermedia focused would be a great stand alone adapter (outside of this project).

## Examples
An example project that shows the adapter in action can be found below

https://github.com/toranb/complex-ember-data-example.git

## Credits
I took a large part of this project (including the motivation) from @escalant3 and his tastypie adapter

https://github.com/escalant3/ember-data-tastypie-adapter/
