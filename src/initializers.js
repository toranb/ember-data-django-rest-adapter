Ember.Application.initializer({
    name: "DjangoRESTAdaptertransforms",
    after: "transforms",

    initialize: function(container, application) {
      application.register('transform:isodate', DS.IsodateTransform);
    }
});