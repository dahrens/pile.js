module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    watch: {
      scripts: {
        files: ['src/**/*.js'],
        tasks: [/*'browserify',*/'babel'],
      },
      docs: {
        files: ['test/**/*.js', 'src/**/*.js'],
        tasks: ['esdoc']
      },
      test: {
        files: ['test/**/*.js', 'src/**/*.js'],
        tasks: ['mochaTest']
      }
    },
    /*browserify: {
        dist: {
            options: {
                transform: [
                    ["babelify", {
                        presets: ["es2015"]
                    }]
                ]
            },
            files: {
                "www/client.js": "client/app.js"
            }
        }
    },*/
    babel: {
      options: {
        "sourceMap": true,
        presets: ["es2015"]
      },
      dist: {
        files: [{
          expand: true,
          cwd: "src/",
          src: ["**/*.js"],
          dest: "dist/",
          ext: ".js"
        }]
      }
    },
    esdoc : {
      dist : {
        options: {
          source: './src',
          destination: './doc'
        }
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'list',
          require: ['babel-register', 'test/lib/bootstrap.js']
        },
        src: ['test/**/*.test.js'],
      }
    }
  });

  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('doc', ['esdoc']);
  grunt.registerTask('develop', ['watch'])
};
