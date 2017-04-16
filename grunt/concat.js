module.exports = {
  test: {
    src: [
      'bower_components/jquery/dist/jquery.min.js',
      'bower_components/handlebars/handlebars.js',
      'bower_components/ember/ember.js',
      'bower_components/ember-data/ember-data.js',
      'tests/lib/jquery.mockjax.js',
      'tests/lib/tmpl.min.js',
      'dist/ember-data-django-rest-adapter.js',
      'tests/app.js'
    ],
    dest: 'tests/dist/deps.min.js'
  }
}
