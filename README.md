# lib-cli 

Electric Imp Library Management Command Line Tool

## Installation

To use the tools you need to have the Node.js/npm installed.

1. Clone repository to your filesystem and change to it
1. Run ``npm i -g``

### Help

You can always use **-h** argument with any command (`lib-cli [command] -h`) to show descriptions of
arguments required by the command. For example:

```
$ lib-cli list -h
lib-cli list

Lists the specified or all libraries available

Options:
  --version     Show version number                                                          [boolean]
  -k, --key     impCentral login key (can be obtained from the impCentral user profile page) [string] [required]
  --production  If specified acts on the production server (be cautious to use it!)          [boolean] [default: true]
  -h, --help    Show help                                                                    [boolean]
  -n, --name    Library name                                                                 [string]
```


### Listing Libraries

```
$ lib-cli list -k <key> [-n <name>] 
```

Lists all the libraries or ones match the library name specified.


### Creating a brand-new Library

```
$ lib-cli create -k <key> -n <name> -d <description> -r <reference> --supported (true|false) --permission (private|require|view) -g
```

Creates the new library with the specified name and description.

If you need to specify an account that you need to create the library for 
(assuming you have appropriate permissions to do so) use ``-a <account name>`` argument.

**NOTE:** If you need to create a *global* library (which essentially means belonging to the *electricimp* account),
use `-g` option.


### Updating a Library

```
$ lib-cli update -k <key> -n <name> -d <description> -r <reference> --supported (true|false) --permission (private|require|view)
```

Updates the library with the name specified. This can be used to mark the library unsupported.


### Publishing a new Version of an existing Library

```
$ lib-cli create-version -k <key> -n <name> -d <description> -r <reference> --supported (true|false) -v <version> -f <source file> 
```

Creates the new version for the library with the specified name from the source code provided.

### Updating the Library Version

```
$ lib-cli update-version -k <key> -n <name> -v <version> -d <description> -r <reference> --supported (true|false)  
```

Updates the specified library version. This option can be used to mark the version unsupported.

## License

Bullwinkle is licensed under the [MIT License](./LICENSE).
