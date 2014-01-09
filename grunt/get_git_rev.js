module.exports = function(grunt) {
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
}
