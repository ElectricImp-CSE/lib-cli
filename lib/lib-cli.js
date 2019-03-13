#!/usr/bin/env node

// Copyright (c) 2016-2017 Electric Imp

// API server API URLs
const API_URL_HOST_STAGING = 'api.ei.run';
const API_URL_HOST_PRODUCTION = 'api.electricimp.com';

const API_PATH_V5_LIBS = '/v5/libraries/';

const fs = require('fs');
const https = require('https');
const util = require('util');
const request = require('sync-request');
const ImpCentralApi = require('imp-central-api');

const argv = require('yargs')
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
        aliases: ['cv'],
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
                    alias: 'ver',
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
                    alias: 'ver',
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
        desc: 'impCentral login key',
        type: 'string',
        required: true
    })
    .option('production', {
        desc: 'If specified acts on the production server (be cautious to use it!)',
        type: 'boolean',
        default: true
    })
    .help('h')
    .alias('h', 'help')
    .global(['k', 'production'])
    .wrap(100)
    .argv;

function _getAPIServerURL(argv) {
    return argv.production ? API_URL_HOST_PRODUCTION : API_URL_HOST_STAGING;
}

async function _getHTTPOptions(argv, method, path) {
    const token = await getAccessToken(argv.key);
    return {
        host: _getAPIServerURL(argv),
        path: path,
        headers: {
            'Authorization': 'Bearer ' + token.access_token,
            'Content-Type': 'application/vnd.api+json'
        },
        method: method,
        accessToken: token.access_token
    }
}

function _getPayload(id, type, name, description, reference, permission, supported, version, code, accountId) {
    const payload = {
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
    if (supported != null) {
        payload.data.attributes['supported'] = supported;
    }
    if (code) {
        payload.data.attributes['code'] = code;
    }
    if (version) {
        payload.data.attributes['version'] = version;
    }
    if (accountId) {
        payload.data['relationships'] = {
            owner: {
                type: 'account',
                id: accountId
            }
        }
    }
    return payload;
}

async function _list(argv, callback, libs = [],
              libsURL = API_PATH_V5_LIBS + "?page[number]=1&page[size]=100") {
    // Get the first page for the libraries list
    let options = await _getHTTPOptions(argv, 'GET', libsURL);
    let result = libs;

    let reqCallback = function (response) {
        let str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            let responseObj = JSON.parse(str);
            result = result.concat(responseObj.data);

            let nextURL = responseObj.links.next;
            if (nextURL) {
                _list(argv, callback, result, nextURL);
            } else {
                callback(result, options.accessToken);
            }
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
    _list(argv, function (libs, accessToken) {
        if (!libs) {
            return;
        }
        libs.forEach(function (library) {
            if (!argv.name || library.attributes.name.indexOf(argv.name) >= 0) {
                let libraryObject = {
                    name: library.attributes.name,
                    permission: library.attributes.permission,
                    supported: library.attributes.supported,
                    versions: []
                };
                let versions = library.relationships.versions;
                if (versions) {
                    versions.forEach(function (v) {
                        let headers = {
                            'Authorization': 'Bearer ' + accessToken,
                            'Content-Type': 'application/vnd.api+json'
                        };

                        let res = request('GET',
                            "https://" + _getAPIServerURL(argv) + API_PATH_V5_LIBS + "/" + library.id + "/versions/" + v.id,
                            {headers});
                        let vObj = JSON.parse(res.getBody('utf8'));
                        // logObj(vObj);
                        libraryObject.versions.push(vObj.data.attributes.version);
                    })
                }
                // logObj(library);
                logObj(libraryObject);
            }
        })
    });
}

function retrieveAccountIdAndDo(argv, callback) {

    const options = {
        host: _getAPIServerURL(argv),
        path: '/v5/accounts?page[size]=100',
        headers: {
            'Authorization': 'Bearer ' + argv.key,
            'Content-Type': 'application/vnd.api+json'
        },
        method: 'GET'
    };

    const accountsCallback = function (response) {
        let str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            const accounts = JSON.parse(str).data;
            let foundId = null;
            for (const i in accounts) {
                const a = accounts[i];
                const targetAccount = argv.g ? 'electricimp' : argv.a;
                if (a.attributes.username === targetAccount) {
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
    const createLibraryForAccountId = async function (accountId) {
        const options = await _getHTTPOptions(argv, 'POST', API_PATH_V5_LIBS);
        const payload = _getPayload(undefined, 'library', argv.n, argv.d, argv.r, argv.permission, argv.supported, undefined, undefined, accountId);

        const callback = function (response) {
            let str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                logJSONString(str);
            });
        };

        const req = https.request(options, callback);
        req.write(JSON.stringify(payload));
        req.end();
    };

    if (argv.a || argv.g) {
        retrieveAccountIdAndDo(argv, createLibraryForAccountId);
    } else {
        // No account specified, use undefined
        createLibraryForAccountId();
    }
}

function getLibraryByName(libraryName, argv, callback) {
    _list(argv, function (libs, accessToken) {
        if (!libs) {
            return;
        }
        let found = null;
        for (const index in libs) {
            if (libraryName === libs[index].attributes.name) {
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
    let str = '';
    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
        logJSONString(str);
    });
}

function updateLibrary(argv) {
    getLibraryByName(argv.name, argv, async function (foundLib) {
        const libId = foundLib.id;
        const options = await _getHTTPOptions(argv, 'PATCH', API_PATH_V5_LIBS + libId);
        const payload = _getPayload(libId, 'library', undefined, argv.d, argv.r, argv.permission, argv.supported, undefined, undefined);

        console.log(payload);

        const req = https.request(options, logJSONResponseStringCallback);
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
        getLibraryByName(argv.name, argv, async function (foundLib) {
            const libId = foundLib.id;
            const options = await _getHTTPOptions(argv, 'POST', API_PATH_V5_LIBS + libId + '/versions');
            const payload = _getPayload(undefined, 'libraryversion', undefined, argv.d, argv.r, undefined, argv.supported, argv.v, code);

            console.log(argv);

            const req = https.request(options, logJSONResponseStringCallback);
            req.write(JSON.stringify(payload));
            req.end();
        });
    });
}

function updateVersion(argv) {
    getLibraryByName(argv.name, argv, async function (foundLib) {
        let foundVersion = null;
        if (foundLib.relationships && foundLib.relationships.versions) {
            const versions = foundLib.relationships.versions;
            for (index in versions) {
                const v = versions[index];
                if (v.id === foundLib.id + ":" + argv.version) {
                    foundVersion = v;
                }
            }
        }

        if (!foundVersion) {
            console.log('Error: no specified version found!');
            return;
        }

        const options = await _getHTTPOptions(argv, 'PATCH', API_PATH_V5_LIBS + foundLib.id + '/versions/' + foundVersion.id);
        const payload = _getPayload(foundVersion.id, 'libraryversion', undefined, argv.d, argv.r, undefined, argv.supported, undefined, undefined);

        const req = https.request(options, logJSONResponseStringCallback);
        req.write(JSON.stringify(payload));
        req.end();
    });
}

async function getAccessToken(loginKey) {
    let api = new ImpCentralApi("https://api.electricimp.com/v5");
    return await api.auth.getAccessToken(loginKey);
}
