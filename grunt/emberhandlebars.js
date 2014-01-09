module.exports = {
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
}
