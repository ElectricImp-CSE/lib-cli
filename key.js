#!/usr/bin/env node

// Copyright (c) 2016-2017 Electric Imp

// API server API URLs
const API_URL_HOST_STAGING      = 'api.ei.run';
const API_URL_HOST_PRODUCTION   = 'api.electricimp.com';

var https = require('https');

var argv = require('yargs')
    .usage("Usage: $0 -e <username> -p <password>")
    .option('e', {
        alias: 'email',
        desc: 'Username or email'
    })
    .option('p', {
        alias: 'password',
        desc: 'User password'
    })
    .option('production', {
        desc: 'If specified acts on the production server (be cautious to use it!)',
        type: 'boolean'
    })
    .required(['e', 'p'])
    .help('h')
    .alias('h', 'help')
    .argv;

function getAPIServerURL() {
    return argv.production ? API_URL_HOST_PRODUCTION : API_URL_HOST_STAGING;
}

function getHTTPOptions() {
    return {
        host: getAPIServerURL(),
        path: '/account/login',
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST'
    }
}

function retrieveToken() {
    var callback = function(response) {
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            console.log(str);
        });
    };

    var req = https.request(getHTTPOptions(), callback);
    req.write(JSON.stringify({
        email: argv.email,
        password: argv.password
    }));
    req.end()
}


retrieveToken();