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

      App.Store = DS.Store.extend({
        revision: 11,
        adapter: DS.DjangoRESTAdapter.create()
      });

Creating with a namespace (not to be confused with Django namespace urls) that will be used as the root url:

      App.Store = DS.Store.extend({
        revision: 11,
        adapter: DS.DjangoRESTAdapter.create({
          namespace: "codecamp"
        })
      });

Creating with a custom plural dictionary that will be used when a custom plural is needed:

      DS.DjangoRESTAdapter.configure("plurals", {"person" : "people"});
      App.Store = DS.Store.extend({
        revision: 11,
        adapter: DS.DjangoRESTAdapter.create()
      });
	  
Filtering is also supported (see further on how to configure the django side):

	App.Person = DS.Model.extend({
	    name: DS.attr('string')
	})
	var person = App.Person.find({name: 'Toran'})

#### python/django side
This project requires the django-rest-framework 2.x branch (specifically 2.1.14 or newer)

i) The adapter assumes you have 2 different endpoints per django model

    class People(generics.ListCreateAPIView):
        model = Person
        serializer_class = resources.PersonSerializer

    class Person(generics.RetrieveUpdateDestroyAPIView):
        model = Person
        serializer_class = resources.PersonSerializer


ii) The above might have a urls.py something like the below

    urlpatterns = patterns('',
        url(r'^/people/(?P<pk>\d+)/$', csrf_exempt(Person.as_view())),
        url(r'^/people/$', csrf_exempt(People.as_view())),
    )


##### filtering
The adapter supports filtering, but by django-rest-framework has turned 
filtering off by default. Please refer to [Generic Filtering][filtering] for
more information about setting up filtering.

[filtering]: http://django-rest-framework.org/api-guide/filtering.html#generic-filtering

## Contributing
This adapter may be useful for someone in the ember.js/django community. If you want to extend it, please open an issue or send a pull request.

## Unit tests

### Browser
Go to the tests directory and type:

    python -m SimpleHTTPServer

Go to http://localhost:8000/tests/ to run the Qunit tests.

### Terminal (PhantomJS)

    # Run once
    rake test

    # Run continuosly listening for changes (OS X only)
    rake autotest

## Versions
Until ember.js and ember-data reach 1.0 a tag will be added with each new revision starting at 10

## Pending Issues
This adapter does not currently support the hypermedia side of the django-rest-framework. I believe another adapter that is hypermedia focused would be a great stand alone adapter (outside of this project).

## Examples
An example project that shows the adapter in action with 1-to-many and m2m relationships can be found at the below

https://github.com/toranb/ember-code-camp

## Credits
I took a large part of this project (including the motivation) from @escalant3 and his tastypie adapter

https://github.com/escalant3/ember-data-tastypie-adapter/
