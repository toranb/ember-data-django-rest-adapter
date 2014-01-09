module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-ember-template-compiler');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-neuter');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.initConfig({
        jshint: {
            all: ['dist/ember-data-django-rest-adapter.js', 'tests/adapter_tests.js', 'tests/adapter_embedded_tests.js']
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        },
        neuter: {
            build: {
                basePath: 'src/',
                src: 'src/main.js',
                dest: 'dist/ember-data-django-rest-adapter.js'
            }
        },
        // modeled after https://github.com/emberjs/ember-dev/blob/master/lib/ember-dev/rakep/filters.rb#L6
        // for some reason the start '^' and end of line '$' do not work in these regexes
        replace: {
            strip_debug_messages_production: {
                src: 'dist/ember-data-django-rest-adapter.js',
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
                    'tests/lib/handlebars-v1.2.1.js',
                    'tests/lib/ember.js',
                    'tests/lib/ember-data.js',
                    'tests/lib/jquery.mockjax.js',
                    'tests/lib/tmpl.min.js',
                    'dist/ember-data-django-rest-adapter.js',
                    'tests/app.js'
                ],
                dest: 'tests/dist/deps.min.js'
            }
        },
        emberhandlebars: {
            compile: {
                options: {
                    templateName: function (sourceFile) {
                        var newSource = sourceFile.replace('tests/templates/', '');
                        return newSource.replace('.handlebars', '');
                    }
                },
                files: ['tests/templates/*.handlebars'],
                dest: 'tests/lib/tmpl.min.js'
            }
        },
        usebanner: {
            distBanner: {
                options: {
                    position: 'top',
                    banner: '<%= grunt.file.read("generators/license.js") %>\n<%= grunt.gitRev %>\n',
                    linebreak: true
                },
                files: {
                    src: ['dist/*.js']
                }
            }
        }
    });

    // stolen from https://github.com/ebryn/ember-model/blob/d44cd01aa900d2e18d0a4d695d0e847821ca0142/tasks/banner.js
    grunt.registerTask('get_git_rev', 'Computate the git revision string', function () {
        var done = this.async(),
            task = this,
            exec = require('child_process').exec;
        exec('git describe --tags',
            function (tags_error, tags_stdout, tags_stderr) {
                var tags = tags_stdout;
                exec('git log -n 1 --format="%h (%ci)"',
                    function (sha_error, sha_stdout, sha_stderr) {
                        var sha = sha_stdout,
                            gitRev = '';

                        if (!tags_error) {
                            gitRev = gitRev + "// " + tags;
                        }

                        if (!sha_error) {
                            gitRev = gitRev + "// " + sha;
                        }

                        // mega hax
                        grunt.gitRev = gitRev;
                        done();
                    });
            });
    });

    grunt.task.registerTask('test', ['build', 'jshint', 'emberhandlebars', 'concat:test', 'karma']);
    grunt.task.registerTask('build', ['neuter:build']);
    grunt.task.registerTask('dist', ['build', 'replace:strip_debug_messages_production', 'uglify:dist', 'get_git_rev', 'usebanner']);
    grunt.task.registerTask('default', ['dist']);
}
