module.exports = function (grunt) {

    require('load-grunt-config')(grunt);

    grunt.task.registerTask('release', ['bump-only', 'dist', 'usebanner:bump', 'copy:bump', 'bump-commit']);
    grunt.task.registerTask('test', ['dist', 'usebanner:distBanner', 'jshint', 'emberhandlebars', 'concat:test', 'karma']);
    grunt.task.registerTask('build', ['neuter:build', 'replace:update_version']);
    grunt.task.registerTask('dist', ['build', 'replace:strip_debug_messages_production', 'uglify:dist', 'get_git_rev']);
    grunt.task.registerTask('default', ['dist', 'usebanner:distBanner']);
}
