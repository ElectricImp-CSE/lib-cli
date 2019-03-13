# lib-cli 

Electric Imp Library Management Command Line Tool

## Installation

To use the tools you need to have the Node.js/npm installed.

1. Clone repository to your filesystem and change to it
1. Run ``npm i -g``

### Help

**lib-cli.js**: you can always use **-h** argument along with a command (`node lib [option] -h`) to show descriptions of
arguments expected to be used with the command. For example:

```
$ lib-cli list -h
lib-cli list

Lists the specified or all libraries available

Options:
  --version     Show version number                                                        [boolean]
  -k, --key     impCentral login key                                             [string] [required]
  --production  If specified acts on the production server (be cautious to use it!)
                                                                           [boolean] [default: true]
  -h, --help    Show help                                                                  [boolean]
  -n, --name    Library name                                                                [string]
```


### Listing Libraries

```
$ lib-cli list -k <key> [-n <name>] 
```

Lists all the libraries or ones that match the library name specified.


### Creating a Library

```
$ lib-cli create -k <key> -n <name> -d <description> -r <reference> --supported (true|false) --permission (private|require|view)
```

Creates the new library with the specified name and description.

If you need to specify an account that you need to create the library for 
(assuming you have appropriate permissions to do so) use ``-a <account name>`` argument. 
If you need to create a *global* library (which essentially means belonging to the *electricimp* account), 
use -g option.


### Updating a Library

```
$ lib-cli update -k <key> -n <name> -d <description> -r <reference> --supported (true|false) --permission (private|require|view)
```

Updates the library with the name specified.

### Creating a new Library Version

```
$ lib-cli create-version -k <key> -n <name> -d <description> -r <reference> --supported (true|false) -v <version> -f <source file> 
```

Creates the new version for the library with the name specified out of the source code provided.

### Updating the Library Version

```
$ lib-cli update-version -k <key> -n <name> -v <version> -d <description> -r <reference> --supported (true|false)  
```

Updates the specified library version.

## License

Bullwinkle is licensed under the [MIT License](./LICENSE).
