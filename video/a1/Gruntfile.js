module.exports = function(grunt) {
    grunt.initConfig({
        postcss: {
            options: {
                map: false,
                processors: [
                    require('autoprefixer')({
                        browsers: 'last 2 versions'
                    }),
                    require('cssnano')
                ]
            },
            src: {
                src: 'css/*.css'
            },
            nano: {
                options: {
                    map: false,
                    processors: [
                        require('cssnano')
                    ]
                },
                src: 'css/crp.css'
            }
        },
        sass: {
            options: {
                style: "expanded",
                sourcemap: "none"
            },
            src: {
                files: {
                    'css/main.css': 'src/main.scss'
                }
            }
        },
        pug: {
            src: {
                files: {
                    'index.html': ['src/index.pug']
                },
                options: {
                    pretty: true
                }
            }
        },
        watch: {
            src: {
                files: ['src/**/*.scss', 'src/**/*.pug'],
                tasks: ['compile']
            }
        }
    });

    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-contrib-pug');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');

    grunt.registerTask('default', []);

    grunt.registerTask('compile', ['pug:src', 'sass:src', 'postcss:src']);
    grunt.registerTask('dev', ['watch:src']);
    grunt.registerTask('ship', ['compile']);

};
