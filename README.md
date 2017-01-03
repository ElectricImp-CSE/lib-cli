# lib-cli 

Library Management Command Line Tools

## Installation

To use the tools you need to have the Node.js/npm installed.

1. Clone repository to your filesystem and change to it
1. Run ``npm i yargs``

### Help

**lib.js**: you can always use **-h** argument along with a command (`node lib [option] -h`) to show descriptions of
arguments expected to be used with the command. For example:

```
$ node lib.js list -h
lib.js list

Options:
  -k, --key   Library API key                   [string] [required]
  -h, --help  Show help                                   [boolean]
  -n, --name  Library name                                 [string]

```


**key.js**: `node key -h` shows help on the key tool.

### Library API Key Generation

```
$ node key -e <email address or username> -p <password>
```

### Listing Libraries

```
$ node lib list -k <key> [-n <name>] 
```

Lists all the libraries or ones that match the library name specified.


### Creating a Library

```
$ node lib create -k <key> -n <name> -d <description> -r <reference> --supported (true|false) --permission (private|require|view)
```

Creates the new library with the specified name and description.

If you need to specify an account that you need to create the library for 
(assuming you have appropriate permissions to do so) use ``-a <account name>`` argument. 
If you need to create a *global* library (which essentially means belonging to the *electricimp* account), 
use -g option.


### Updating a Library

```
$ node lib update -k <key> -n <name> -d <description> -r <reference> --supported (true|false) --permission (private|require|view)
```

Updates the library with the name specified.

### Creating a new Library Version

```
$ node lib create-version -k <key> -n <name> -d <description> -r <reference> --supported (true|false) -v <version> -f <source file> 
```

Creates the new version for the library with the name specified out of the source code provided.

### Updating the Library Version

```
$ node lib update-version -k <key> -n <name> -v <version> -d <description> -r <reference> --supported (true|false)  
```

Updates the specified library version.

## License

Bullwinkle is licensed under the [MIT License](./LICENSE).
