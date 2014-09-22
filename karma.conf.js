module.exports = function(config) {
  config.set({
    basePath: 'tests',
    frameworks: ['qunit'],
    files: [
      'dist/deps.min.js',
      'helper.js',
      'adapter_tests.js',
      'adapter_embedded_tests.js',
      'adapter_polymorphic_tests.js',
      'transforms_tests.js'
    ],
    reporters: ['dots'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_ERROR,
    autoWatch: false,
    browsers: ['PhantomJS'],
    singleRun: true
  });
};
