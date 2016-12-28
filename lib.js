// Copyright (c) 2016 Electric Imp

// Staging server API URL
const API_URL_HOST = "api.ei.run";
const API_PATH_V5_LIBS = "/v5/libraries/";

var fs = require("fs");
var https = require('https');

var argv = require('yargs')
    .usage("Usage: $0 <command> [options]")
    .command('list', 'Lists the specified or all libraries available', {}, listLibraries)
    .command('create', 'Creates the new library', {}, createLibrary)
    .command('update', 'Updates the library with the options specified', {}, updateLibrary)
    .command('create-version', 'Creates the new library version', {}, createVersion)
    .command('update-version', 'Updates the library with the options specified', {}, updateVersion)
    .option('k', {
        alias: ['api-key', 'key'],
        desc: 'Library API key'
    })
    .option('n', {
        alias: 'name',
        desc: 'Library name',
        type: 'string'
    })
    .option('d', {
        alias: 'description',
        desc: 'Library description',
        type: 'string'
    })
    .option('r', {
        alias: 'reference',
        desc: 'External reference',
        type: 'string'
    })
    .option('v', {
        alias: 'version',
        desc: 'Library version',
        type: 'string'
    })
    .option('f', {
        alias: 'file',
        desc: 'Source code of the library',
        type: 'string'
    })
    .option('supported', {
        desc: 'Specified the supported status of the library',
        default: true,
        type: 'boolean'
    })
    .option('permission', {
        desc: 'Library permission',
        choices: ['private', 'require', 'view'],
        default: 'private',
        type: 'string'
    })
    .help('h')
    .alias('h', 'help')
    .global(['k', 'n', 'd', 'f', 'v', 'supported', 'permission'])
    .wrap(80)
    .argv;

function getHTTPOptions(argv, method, path) {
    return {
        host: API_URL_HOST,
        path: path,
        headers: {
            "Authorization": "Basic " + new Buffer(argv.key).toString("base64"),
            "Content-Type": "application/vnd.api+json"
        },
        method: method
    }
}

function getPayload(id, type, name, description, reference, permission, supported, version, code) {
    return {
        data: {
            attributes: {
                name: name,
                description: description,
                reference: reference,
                permission: permission,
                supported: supported,
                code: code,
                version: version
            },
            type: type,
            id: id
        }
    }
}

function list(argv, callback) {
    var options = getHTTPOptions(argv, "GET", API_PATH_V5_LIBS);

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

function listLibraries(argv) {
    list(argv, function (libs) {
        if (!libs) {
            return;
        }
        libs.forEach(function (library) {
            if (!argv.name || library.attributes.name.indexOf(argv.name) >= 0) {
                console.log(JSON.stringify(library));
            }
        })
    });
}

function createLibrary(argv) {
    var options = getHTTPOptions(argv, "POST", API_PATH_V5_LIBS);
    var payload = getPayload(undefined, "library", argv.n, argv.d, argv.r, argv.permission, argv.supported);

    // TODO: cleanup usage the code duplication when using the callback across the code
    var callback = function (response) {
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            console.log(str);
        });
    };

    console.log(JSON.stringify(payload));
    var req = https.request(options, callback);
    req.write(JSON.stringify(payload));
    req.end();
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
            console.log("Error: can not find the library specified!")
        }
    });
}

function updateLibrary(argv) {
    getLibraryByName(argv.name, argv, function (foundLib) {
        var libId = foundLib.id;
        var options = getHTTPOptions(argv, "PATCH", API_PATH_V5_LIBS + libId);
        var payload = getPayload(libId, "library", undefined, argv.d, argv.r, argv.permission, argv.supported);

        var reqCallback = function (response) {
            var str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                console.log(str);
            });
        };

        var req = https.request(options, reqCallback);
        req.write(JSON.stringify(payload));
        req.end();
    });
}

function createVersion(argv) {
    fs.readFile(argv.file, 'utf8', function (err, code) {
        if (err) {
            console.error("Error reading the file: " + argv.file);
            return
        }
        getLibraryByName(argv.name, argv, function(foundLib) {
            var libId = foundLib.id;
            var options = getHTTPOptions(argv, "POST", API_PATH_V5_LIBS + libId + '/versions');
            var payload = getPayload(undefined, "libraryversion", undefined, argv.d, argv.r, undefined, argv.supported, argv.v, code);

            var callback = function (response) {
                var str = '';
                response.on('data', function (chunk) {
                    str += chunk;
                });

                response.on('end', function () {
                    console.log(str);
                });
            };

            console.log(JSON.stringify(payload));
            var req = https.request(options, callback);
            req.write(JSON.stringify(payload));
            req.end();
        });
    });
}

function updateVersion(argv) {
    getLibraryByName(argv.name, argv, function(foundLib) {
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
            console.log("Error: no specified version found!");
            return;
        }

        var options = getHTTPOptions(argv, "PATCH", API_PATH_V5_LIBS + foundLib.id + '/versions/' + foundVersion.id);
        var payload = getPayload(foundVersion.id, "libraryversion", undefined, argv.d, argv.r, undefined, argv.supported);

        var callback = function (response) {
            var str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                console.log(str);
            });
        };

        console.log(JSON.stringify(payload));
        var req = https.request(options, callback);
        req.write(JSON.stringify(payload));
        req.end();
    });
}