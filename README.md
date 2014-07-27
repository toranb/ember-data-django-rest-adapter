ember-data-django-rest-adapter
==============================

[![Build Status][]](https://travis-ci.org/toranb/ember-data-django-rest-adapter)

This package enables you to build modern web applications using [Ember.js][]
and [Django REST Framework][].  For detailed information on installing and
using the adapter, see the [wiki documentation].


Community
---------

* IRC: #ember-django-adapter on freenode
* Issues: [ember-data-django-rest-adapter/issues][]


Installing
----------

The adapter is [packaged separately](https://github.com/dustinfarris/ember-django-adapter)
as an Ember CLI add-on.  Installation is very simple:

```
npm i --save-dev ember-django-adapter
```

and set the `API_HOST` environment variable in `config/environment.js`, e.g.:

```js
if (environment === 'development') {
  ENV.APP.API_HOST = 'http://localhost:8000';
}
if (environment === 'production') {
  ENV.APP.API_HOST = 'https://api.myproject.com';
}
```

See the [wiki documentation][] for additional installation instructions,
including how to use the adapter with vanilla ember (without using ember-cli).


Pending Issues
--------------

* Async belongsTo/hasMany requires a pull-request be merged into ember-data
  core ([#63][])

* Pagination is not yet supported ([#80][])


Credits
-------

I took a large part of this project (including the motivation) from @escalant3
and his [tastypie adapter][].

Special thanks to all [contributors][]!


License
-------

Copyright © 2014 Toran Billups http://toranbillups.com

Licensed under the MIT License


[Build Status]: https://secure.travis-ci.org/toranb/ember-data-django-rest-adapter.png?branch=master
[wiki documentation]: https://github.com/toranb/ember-data-django-rest-adapter/wiki
[ember-data-django-rest-adapter/issues]: https://github.com/toranb/ember-data-django-rest-adapter/issues
[Ember.js]: http://emberjs.com/
[Django REST Framework]: http://www.django-rest-framework.org/
[Ember CLI]: https://github.com/stefanpenner/ember-cli
[tastypie adapter]: https://github.com/escalant3/ember-data-tastypie-adapter/
[contributors]: https://github.com/toranb/ember-data-django-rest-adapter/graphs/contributors
[#61]: https://github.com/toranb/ember-data-django-rest-adapter/issues/61
[#63]: https://github.com/toranb/ember-data-django-rest-adapter/pull/63
[#80]: https://github.com/toranb/ember-data-django-rest-adapter/issues/80
