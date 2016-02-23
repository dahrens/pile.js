module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    watch: {
      scripts: {
        files: ['src/**/*.es6'],
        tasks: [/*'browserify',*/'babel']
      },
      docs: {
        files: ['test/**/*.es6', 'src/**/*.es6'],
        tasks: ['esdoc']
      },
      test: {
        files: ['test/**/*.es6', 'src/**/*.es6'],
        tasks: ['shell']
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
        sourceMap: true,
        presets: ["es2015"]
      },
      dist: {
        files: [{
          expand: true,
          cwd: "src/",
          src: ["**/*.es6"],
          dest: "lib/",
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
    shell: {
      options: {
        stderr: false
      },
      target: {
        command: "./node_modules/.bin/babel-node ./node_modules/istanbul/lib/cli.js cover ./node_modules/.bin/_mocha -- 'test/**/*.es6' --require test/lib/bootstrap"
      }
    }
  });

  grunt.registerTask('test', ['shell']);
  grunt.registerTask('build', ['babel']);
  grunt.registerTask('doc', ['esdoc']);
  grunt.registerTask('dev', ['watch']);
};
