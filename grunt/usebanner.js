module.exports = {
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
