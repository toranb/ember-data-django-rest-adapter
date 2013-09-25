module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-ember-template-compiler');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-neuter');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-text-replace');

  grunt.initConfig({
    jshint: {
      all: ['tests/adapter.js', 'tests/adapter_tests.js', 'tests/adapter_embedded_tests.js']
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },
    neuter: {
      build: {
        src: 'packages/ember-data-django-rest-adapter/lib/main.js',
        dest: 'dist/ember-data-django-rest-adapter.js'
      }
    },
    // modeled after https://github.com/emberjs/ember-dev/blob/master/lib/ember-dev/rakep/filters.rb#L6
    // for some reason the start '^' and end of line '$' do not work in these regexes
    replace: {
      strip_debug_messages_production: {
        src : 'dist/ember-data-django-rest-adapter.js',
        dest: 'dist/ember-data-django-rest-adapter.prod.js',
        replacements: [{
          from: /Ember.(assert|deprecate|warn|debug)\(.*\)/g,
          to: ''
        }]
      }
    },
    uglify: {
      dist: {
        src: 'dist/ember-data-django-rest-adapter.prod.js',
        dest: 'dist/ember-data-django-rest-adapter.min.js'
      },
    },
    concat: {
      test: {
          src: [
            'tests/lib/jquery-1.9.1.js',
            'tests/lib/handlebars-1.0.0.js',
            'tests/lib/ember-1.0.0.js',
            'tests/lib/ember-data.js',
            'tests/lib/jquery.mockjax.js',
            'tests/lib/tmpl.min.js',
            'dist/ember-data-django-rest-adapter.js',
            'tests/app.js'],
          dest: 'tests/dist/deps.min.js'
      }
    },
    emberhandlebars: {
        compile: {
            options: {
                templateName: function(sourceFile) {
                    var newSource = sourceFile.replace('tests/templates/', '');
                    return newSource.replace('.handlebars', '');
                }
            },
            files: ['tests/templates/*.handlebars'],
            dest: 'tests/lib/tmpl.min.js'
        }
    }
  });
  
  grunt.task.registerTask('test', ['build', 'jshint', 'emberhandlebars', 'concat:test', 'karma']);
  grunt.task.registerTask('build', ['neuter:build']);
  grunt.task.registerTask('dist', ['build', 'replace:strip_debug_messages_production', 'uglify:dist']);
  grunt.task.registerTask('default', ['dist']);
}
