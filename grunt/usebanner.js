module.exports = {
    distBanner: {
        options: {
            position: 'top',
            banner: '<%= grunt.file.read("generators/license.js") %>\n<%= grunt.gitRevTags %><%= grunt.gitRevSha %>\n',
            linebreak: true
        },
        files: {
            src: ['dist/*.js']
        }
    },
    bump: {
        options: {
            position: 'top',
            banner: '<%= grunt.file.read("generators/license.js") %>\n// v<%= package.version %>\n<%= grunt.gitRevSha %>\n',
            linebreak: true
        },
        files: {
            src: ['dist/*.js']
        }
    }
}
