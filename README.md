ember-data-django-rest-adapter 
==============================

[![Build Status][]](https://travis-ci.org/toranb/ember-data-django-rest-adapter)

This package enables you to build modern web applications using [Ember.js][]
and [Django REST Framework][].  For detailed information on installing and
using the adapter, see the [wiki documentation].


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

* Date and DateTime are not yet built into the adapter (see the WIP PR for a 
  workaround)

* Async belongsTo/hasMany requires a pull-request be merged into ember-data 
  core (see the WIP branch for a workaround)

* Pagination is not yet supported


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
[Ember.js]: http://emberjs.com/
[Django REST Framework]: http://www.django-rest-framework.org/
[Ember CLI]: https://github.com/stefanpenner/ember-cli
[tastypie adapter]: https://github.com/escalant3/ember-data-tastypie-adapter/
[contributors]: https://github.com/toranb/ember-data-django-rest-adapter/graphs/contributors
