// Copyright (c) 2016 Electric Imp

const API_URL_HOST = "api.ei.run";

var https = require('https');

var argv = require('yargs')
    .usage("Usage: $0 -e <username> -p <password>")
    .option('e', {
        alias: 'email',
        desc: 'User email'
    })
    .option('p', {
        alias: 'password',
        desc: 'User password'
    })
    .help('h')
    .alias('h', 'help')
    .argv;

function getHTTPOptions() {
    return {
        host: API_URL_HOST,
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