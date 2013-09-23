module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-ember-template-compiler');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({
    jshint: {
      all: ['tests/adapter.js', 'tests/adapter_tests.js', 'tests/adapter_embedded_tests.js']
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
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
            'tests/adapter.js',
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

  grunt.task.registerTask('test', ['jshint', 'emberhandlebars', 'concat:test', 'karma']);
}
