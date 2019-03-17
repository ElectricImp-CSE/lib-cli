# lib-cli 0.1.2 #

The Electric Imp library management command-line tool.

## Installation ##

To use imp-cli, you need to have the Node.js and npm installed.

1. Clone this repository to your filesystem.
1. `cd` into the repo directory.
1. Run ``npm i -g``

## Help ##

You can always use the `-h` argument with any command (`lib-cli [command] -h`) to show descriptions of the arguments required by the command. For example:

```bash
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

## Authentication ##

Making use of lib-cli requires a login key for an Electric Imp account. You can get a login key by logging in to impCentral, and visiting **My Account > Profile > Login Keys**. Create a login key (or use an existing one), then select and copy the **Token** value. You will need to paste this into each lib-cli command you enter.

## Listing Libraries ##

```bash
$ lib-cli list -k <key> [-n <name>] 
```

Lists all the libraries, or ones that match the specified library name. The name value is case-sensitive. 

#### Example ####

```bash
$ lib-cli list -k <YOUR_KEY> -n DarkSky
```

yields:

```bash
{ name: 'DarkSky.class.nut',
  permission: 'view',
  supported: true,
  versions: [ '1.0.1', '1.0.0' ] }
```

## Creating A New Library ##

```bash
$ lib-cli create -k <key> -n <name> -d <description> -r <reference> --supported (true|false) --permission (private|require|view) -g
```

Creates the new library with the specified name and description. It creates a record for the library, but does not automatically establish the first version. For that, you must [create your first published version](#publishing-a-new-version-of-an-existing-library) of the library.

The **reference** field should be used to include a link to the source repo. 

The **supported** field simply provides flag to indicate whether Electric Imp currently supports the library. This defaults to `true`; you may wish to change this later to `false` if the library is ever deprecated.

The **permission** field has three options:

- `private` &mdash; Only you can make use of the library (ie. `#require` it)
- `require` &mdash; The library is public, but users will only be able to `#require` it
- `view` &mdash; The library is public, and users not only `#require` it but also view the source code (not yet supported)

If you need to specify an account that you need to create the library for a specific user &mdash; assuming you have appropriate permissions to do so &mdash; use the ``-a <account name>`` argument.

**Note** If you need to create a *global* library (which essentially means belonging to the *electricimp* account, ie. a public library), use `-g` option.

### Example ###

Create a new public library, MyNewLibrary:

```bash
$ lib-cli create -k <YOUR_KEY> -n MyNewLibrary -d 'A useful web service integration' -r https://github.com/electricimp/mynewlibrary --supported true --permission view -g
```

## Updating A Library ##

```bash
$ lib-cli update -k <key> -n <name> -d <description> -r <reference> --supported (true|false) --permission (private|require|view)
```

Updates the library with the specified name. This can also be used to mark the library as unsupported, change its access permission, its reference and/or description.

## Publishing A New Version Of An Existing Library ##

```bash
$ lib-cli create-version -k <key> -n <name> -d <description> -r <reference> --supported (true|false) -v <version> -f <source file> 
```

Creates the new version of the library with the specified name from the source code provided. 

This is the second step (having first [created a new library](#creating-a-new-library)) in making the library available to users.

You should ensure the name of the source code file you pass (with the `-f` switch) matches the name that you wish users to include in their `#require` statements. The file name you provide here will determine the `#require` name.

To update the version number without changing the code, eg. moving a library from out of beta release (say, version 0.1.0) to initial full release (version 1.0.0) use the `-v` switch but do not provide a source code file.

### Example ###

Publish a new public library, MyNewLibrary 1.0.0:

```bash
$ lib-cli create-version -k <YOUR_KEY> -n MyNewLibrary -v 1.0.0 -f /Users/smitty/Documents/GitHub/MyNewLibrary/mynewlibrary.agent.lib.nut
```

## Typical Workflows ##

### Publish A New Public Library ###

1. Call `lib-cli create...` to create the library.
1. Call `lib-cli create-version...` to publish the first version of the library.

### Release A New Version ###

1. Call `lib-cli create-version...` to publish the next version of the library.

### Make A Private Library Public ###

1. Call `lib-cli update...` to change the library’s **permission** field to `view`.

### EOL A Deprecated Library ###

1. Call `lib-cli update...` to change the library’s **supported** field to `false`.

## License ##

lib-cli is licensed under the [MIT License](./LICENSE).
