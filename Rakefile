require "bundler/setup"
require "ember-dev/tasks"

task :clean => "ember:clean"
task :dist => "ember:dist"
task :test, [:suite] => "ember:test"
task :default => :dist
