module.exports = function (grunt) {

    require('load-grunt-config')(grunt);

    grunt.task.registerTask('test', ['build', 'jshint', 'emberhandlebars', 'concat:test', 'karma']);
    grunt.task.registerTask('build', ['neuter:build']);
    grunt.task.registerTask('dist', ['build', 'replace:strip_debug_messages_production', 'uglify:dist', 'get_git_rev', 'usebanner']);
    grunt.task.registerTask('default', ['dist']);
}
