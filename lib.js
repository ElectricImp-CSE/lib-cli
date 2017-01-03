#!/usr/bin/env node

// Copyright (c) 2016 Electric Imp

// Staging server API URL
const API_URL_HOST = 'api.ei.run';
const API_PATH_V5_LIBS = '/v5/libraries/';

var fs = require('fs');
var https = require('https');
var util = require('util');

var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command({
        command: 'list',
        aliases: ['l'],
        desc: 'Lists the specified or all libraries available',
        builder: function (yargs) {
            yargs
                .option('n', {
                    alias: 'name',
                    desc: 'Library name',
                    type: 'string'
                })
        },
        handler: listLibraries
    })
    .command({
        command: 'create',
        aliases: ['create-library'],
        desc: 'Creates the new library',
        builder: function (yargs) {
            yargs
                .option('n', {
                    alias: 'name',
                    desc: 'Library name',
                    type: 'string',
                    required: true
                })
                .option('d', {
                    alias: 'description',
                    desc: 'New library description',
                    type: 'string'
                })
                .option('r', {
                    alias: 'reference',
                    desc: 'External reference to the library (github)',
                    type: 'string'
                })
                .option('p', {
                    alias: 'permission',
                    desc: 'Library permission',
                    choices: ['private', 'require', 'view'],
                    default: 'private',
                    type: 'string'
                })
                .option('s', {
                    alias: 'supported',
                    desc: 'Library status (supported or not)',
                    default: true,
                    type: 'boolean'
                })
                .option('a', {
                    alias: 'account',
                    desc: 'Account on behalf of which the operation is performed',
                    type: 'string'
                })
                .option('g', {
                    alias: 'global',
                    desc: 'If the flag is specified, the operation is done on behalf of electricimp account ' +
                    '(i.e. is equivalent to -a electricimp)',
                    type: 'boolean'
                })
        },
        handler: createLibrary
    })
    .command({
        command: 'update',
        aliases: ['update-library', 'up', 'u'],
        desc: 'Patch the existing library attributes',
        builder: function (yargs) {
            yargs
                .option('n', {
                    alias: 'name',
                    desc: 'Library name',
                    type: 'string',
                    required: true
                })
                .option('d', {
                    alias: 'description',
                    desc: 'New library description',
                    type: 'string'
                })
                .option('r', {
                    alias: 'reference',
                    desc: 'Reference to the library sources (at GitHub)',
                    type: 'string'
                })
                .option('p', {
                    alias: 'permission',
                    desc: 'Library permission',
                    choices: ['private', 'require', 'view'],
                    type: 'string'
                })
                .option('s', {
                    alias: 'supported',
                    desc: 'Library status (supported or not)',
                    type: 'boolean'
                })
        },
        handler: updateLibrary
    })
    .command({
        command: 'create-version',
        aliases: ['cv', 'version'],
        desc: 'Creates the new library version',
        builder: function (yargs) {
            yargs
                .option('n', {
                    alias: 'name',
                    desc: 'Library name',
                    type: 'string',
                    required: true
                })
                .option('d', {
                    alias: 'description',
                    desc: 'New library description',
                    type: 'string'
                })
                .option('r', {
                    alias: 'reference',
                    desc: 'Reference to the library version sources (at GitHub)',
                    type: 'string'
                })
                .option('s', {
                    alias: 'supported',
                    desc: 'Version status (supported or not)',
                    default: true,
                    type: 'boolean'
                })
                .option('v', {
                    alias: 'version',
                    desc: 'Library version string',
                    type: 'string',
                    required: true
                })
                .option('f', {
                    alias: 'file',
                    desc: 'Source code of the library',
                    type: 'string',
                    required: true
                })
        },
        handler: createVersion
    })
    .command({
        command: 'update-version',
        aliases: ['uv'],
        desc: 'Updates the library with the options specified',
        builder: function (yargs) {
            yargs
                .option('n', {
                    alias: 'name',
                    desc: 'Library name',
                    type: 'string',
                    required: true
                })
                .option('v', {
                    alias: 'version',
                    desc: 'Library version string',
                    type: 'string',
                    required: true
                })
                .option('d', {
                    alias: 'description',
                    desc: 'New library description',
                    type: 'string'
                })
                .option('r', {
                    alias: 'reference',
                    desc: 'Reference to the library version sources (at GitHub)',
                    type: 'string'
                })
                .option('s', {
                    alias: 'supported',
                    desc: 'Version status (supported or not)',
                    type: 'boolean'
                })
        },
        handler: updateVersion
    })
    .option('k', {
        alias: 'key',
        desc: 'Library API key',
        type: 'string',
        required: true
    })
    .help('h')
    .alias('h', 'help')
    .global('k')
    .wrap(100)
    .argv;

function getHTTPOptions(argv, method, path) {
    return {
        host: API_URL_HOST,
        path: path,
        headers: {
            'Authorization': 'Basic ' + new Buffer(argv.key).toString('base64'),
            'Content-Type': 'application/vnd.api+json'
        },
        method: method
    }
}

function getPayload(id, type, name, description, reference, permission, supported, version, code, accountId) {
    var payload = {
        data: {
            attributes: {}
        }
    };

    if (id) {
        payload.data['id'] = id;
    }
    if (type) {
        payload.data['type'] = type;
    }
    if (name) {
        payload.data.attributes['name'] = name;
    }
    if (description) {
        payload.data.attributes['description'] = description;
    }
    if (reference) {
        payload.data.attributes['reference'] = reference;
    }
    if (permission) {
        payload.data.attributes['permission'] = permission;
    }
    if (supported) {
        payload.data.attributes['supported'] = supported;
    }
    if (code) {
        payload.data.attributes['code'] = code;
    }
    if (version) {
        payload.data.attributes['version'] = version;
    }
    if (accountId) {
        payload.data['ralationships'] = {
            owner: {
                type: 'account',
                id: accountId
            }
        }
    }
    return payload;
}

function list(argv, callback) {
    var options = getHTTPOptions(argv, 'GET', API_PATH_V5_LIBS);

    var reqCallback = function (response) {
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            var libs = JSON.parse(str).data;
            callback(libs);
        });
    };
    https.request(options, reqCallback).end();
}

function logObj(obj) {
    console.log(util.inspect(obj, {depth: null, colors: true}));
}

function logJSONString(jsonString) {
    const object = JSON.parse(jsonString);
    console.dir(object, {depth: null, colors: true});
}

function listLibraries(argv) {
    list(argv, function (libs) {
        if (!libs) {
            return;
        }
        libs.forEach(function (library) {
            if (!argv.name || library.attributes.name.indexOf(argv.name) >= 0) {
                logObj(library);
            }
        })
    });
}

function retrieveAccountIdAndDo(argv, callback) {
    var options = {
        host: API_URL_HOST,
        path: '/v5/accounts',
        headers: {
            'Authorization': 'Basic ' + new Buffer(argv.key).toString('base64'),
            'Content-Type': 'application/vnd.api+json'
        },
        method: 'GET'
    };

    var accountsCallback = function (response) {
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            var accounts = JSON.parse(str).data;
            var foundId = null;
            for (var i in accounts) {
                var a = accounts[i];
                var targetAccount = argv.g ? 'electricimp' : argv.a;
                if (a.attributes.name == argv.a) {
                    foundId = a.id;
                    break;
                }
            }

            if (foundId) {
                callback(foundId);
            }
        });
    };
    https.request(options, accountsCallback).end();
}

function createLibrary(argv) {
    var createLibraryForAccountId = function (accountId) {
        var options = getHTTPOptions(argv, 'POST', API_PATH_V5_LIBS);
        var payload = getPayload(undefined, 'library', argv.n, argv.d, argv.r, argv.permission, argv.supported, undefined, undefined, accountId);

        var callback = function (response) {
            var str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                logJSONString(str);
            });
        };

        var req = https.request(options, callback);
        req.write(JSON.stringify(payload));
        req.end();
    };

    if (argv.a) {
        retrieveAccountIdAndDo(argv, createLibraryForAccountId);
    } else {
        // No account specified, use undefined
        createLibraryForAccountId();
    }
}

function getLibraryByName(libraryName, argv, callback) {
    list(argv, function (libs) {
        if (!libs) {
            return;
        }
        var found = null;
        for (var index in libs) {
            if (libraryName == libs[index].attributes.name) {
                found = libs[index];
                break;
            }
        }

        if (found) {
            callback(found);
        } else {
            console.log('Error: can not find the library specified!')
        }
    });
}

function logJSONResponseStringCallback(response) {
    var str = '';
    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
        logJSONString(str);
    });
}

function updateLibrary(argv) {
    getLibraryByName(argv.name, argv, function (foundLib) {
        var libId = foundLib.id;
        var options = getHTTPOptions(argv, 'PATCH', API_PATH_V5_LIBS + libId);
        var payload = getPayload(libId, 'library', undefined, argv.d, argv.r, argv.permission, argv.supported, undefined, undefined);

        console.log(payload);

        var req = https.request(options, logJSONResponseStringCallback);
        req.write(JSON.stringify(payload));
        req.end();
    });
}

function createVersion(argv) {
    fs.readFile(argv.file, 'utf8', function (err, code) {
        if (err) {
            console.error('Error reading the file: ' + argv.file);
            return
        }
        getLibraryByName(argv.name, argv, function (foundLib) {
            var libId = foundLib.id;
            var options = getHTTPOptions(argv, 'POST', API_PATH_V5_LIBS + libId + '/versions');
            var payload = getPayload(undefined, 'libraryversion', undefined, argv.d, argv.r, undefined, argv.supported, argv.v, code);

            var req = https.request(options, logJSONResponseStringCallback);
            req.write(JSON.stringify(payload));
            req.end();
        });
    });
}

function updateVersion(argv) {
    getLibraryByName(argv.name, argv, function (foundLib) {
        var foundVersion = null;
        if (foundLib.relationships && foundLib.relationships.versions) {
            var versions = foundLib.relationships.versions;
            for (index in versions) {
                var v = versions[index];
                if (v.attributes.version == argv.version) {
                    foundVersion = v;
                }
            }
        }

        if (!foundVersion) {
            console.log('Error: no specified version found!');
            return;
        }

        var options = getHTTPOptions(argv, 'PATCH', API_PATH_V5_LIBS + foundLib.id + '/versions/' + foundVersion.id);
        var payload = getPayload(foundVersion.id, 'libraryversion', undefined, argv.d, argv.r, undefined, argv.supported, undefined, undefined);

        var req = https.request(options, logJSONResponseStringCallback);
        req.write(JSON.stringify(payload));
        req.end();
    });
}
