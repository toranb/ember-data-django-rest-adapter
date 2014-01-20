var VERSION = "DJANGO-REST-ADAPTER-VERSION";

DS.DjangoRESTSerializer.VERSION = VERSION;
DS.DjangoRESTAdapter.VERSION = VERSION;

if (Ember.libraries) {
  Ember.libraries.register("ember-data-django-rest-adapter", VERSION);
}

