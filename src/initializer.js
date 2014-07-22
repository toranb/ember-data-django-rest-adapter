Ember.Application.initializer({
  name: 'DjangoDatetimeTransforms',

  initialize: function(container, application) {
    application.register('transform:date', DS.DjangoDateTransform);
    application.register('transform:datetime', DS.DjangoDatetimeTransform);
  }
});
