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

      App.store = DS.Store.create({
        revision: 10,
        adapter: DS.DjangoRESTAdapter.extend()
      });

Creating with a namespace that will be used as the root url:

      App.store = DS.Store.create({
        revision: 11,
        adapter: DS.DjangoRESTAdapter.extend({
          namespace: "codecamp"
        })
      });

Creating with a custom plural dictionary that will be used when a custom plural is needed:

      App.store = DS.Store.create({
        revision: 11,
        adapter: DS.DjangoRESTAdapter.extend({
          plurals: {
            person: 'people'
          }
        })
      });


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
        url(r'^/(?P<pk>\d+)$', csrf_exempt(Person.as_view())),
        url(r'^$', csrf_exempt(People.as_view())),
    )



## Contributing
This is the adapter may be useful for someone in the ember.js/django community. If you want to extend it, please open an issue or send a pull request.

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
This adapter requires a minor change to the core ember-data library to include a parent record for findMany.

What this means for anyone using it right now is that your basic ember-data script won't work. Use the custom ember-data js file found in tests/lib

This should be resolved / added with a pull request that is still pending

https://github.com/emberjs/data/issues/573

## Examples
An example project is in the works, until this is added as part of this repository checkout my other ember-code-camp example

https://github.com/toranb/ember-code-camp

## Credits
I took a large part of this project (including the motivation) from @escalant3 and his tastypie adapter

https://github.com/escalant3/ember-data-tastypie-adapter/
