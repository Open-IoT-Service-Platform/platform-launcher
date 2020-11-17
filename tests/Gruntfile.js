/**
 * Copyright (c) 2020 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        dirs: {
            jsfiles: ['Gruntfile.js',
                'oisp-prep-only.js',
                'oisp-tests.js',
                'test-backup-after.js',
                'test-backup-before.js',
                'subtests/*.js',
                'lib/*.js',
                'lib/**/*.js']
        },
        jshint: {
            options: {
                jshintrc: 'jshint.json',
                ignores: ['lib/entropizer/*.js' ]
            },
            local: {
                src: ['<%= dirs.jsfiles %>'],
                options: {
                    force: false
                }
            }
        },
        eslint: {
            local: {
                options: {
                    configFile: 'eslint.json',
                    ignorePattern: [ 'lib/entropizer/*.js' ],
                    quiet: true
                },
                fix: true,
                src: ['<%= dirs.jsfiles %>'],
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-eslint');


    // Default task(s).
    grunt.registerTask('default', [
        'eslint:local',
        'jshint:local',
    ]);

    grunt.registerTask('validate', [
        'eslint:local',
        'jshint:local'
    ]);
};
