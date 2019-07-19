# typeorm-model-generator

[![Build Status](https://travis-ci.org/Kononnable/typeorm-model-generator.svg?branch=master)](https://travis-ci.org/Kononnable/typeorm-model-generator)
[![npm version](https://badge.fury.io/js/typeorm-model-generator.svg)](https://badge.fury.io/js/typeorm-model-generator)
[![codecov](https://codecov.io/gh/Kononnable/typeorm-model-generator/branch/master/graph/badge.svg)](https://codecov.io/gh/Kononnable/typeorm-model-generator)

Generates models for TypeORM from existing databases.
Suported db engines:
* Microsoft SQL Server
* PostgreSQL
* MySQL
* MariaDB
* Oracle Database
* SQLite


## Installation
### Global module
To install module globally simply type `npm i -g typeorm-model-generator` in your console.
### Npx way
Thanks to npx you can use npm modules without polluting global installs. So nothing to do here :)
>To use `npx` you need to use npm at version at least 5.2.0. Try updating your npm by `npm i -g npm`
### Database drivers
All database drivers except oracle are installed by default. To use typeorm-model-generator with oracle databese you need to install driver with `npm i oracledb` and configure [oracle install client](http://www.oracle.com/technetwork/database/database-technologies/instant-client/overview/index.html) on your machine.

## Usage

```shell
Usage: typeorm-model-generator -h <host> -d <database> -p [port] -u <user> -x
[password] -e [engine]

Options:
  --help                 Show help                                     [boolean]
  --version              Show version number                           [boolean]
  -h, --host             IP adress/Hostname for database server
                                                          [default: "127.0.0.1"]
  -d, --database         Database name(or path for sqlite)            [required]
  -u, --user             Username for database server
  -x, --pass             Password for database server              [default: ""]
  -p, --port             Port number for database server
  -e, --engine           Database engine
          [choices: "mssql", "postgres", "mysql", "mariadb", "oracle", "sqlite"]
                                                              [default: "mssql"]
  -o, --output           Where to place generated models
                            [default: "Z:\Repos\typeorm-model-generator\output"]
  -s, --schema           Schema name to create model from. Only for mssql and
                         postgres
  --ssl                                               [boolean] [default: false]
  --noConfig             Doesn't create tsconfig.json and ormconfig.json
                                                      [boolean] [default: false]
  --cf, --case-file      Convert file names to specified case
                 [choices: "pascal", "param", "camel", "none"] [default: "none"]
  --ce, --case-entity    Convert class names to specified case
                          [choices: "pascal", "camel", "none"] [default: "none"]
  --cp, --case-property  Convert property names to specified case
                          [choices: "pascal", "camel", "none"] [default: "none"]
  --lazy                 Generate lazy relations      [boolean] [default: false]
  -a, --active-record    Generate models that use the ActiveRecord syntax
                                                      [boolean] [default: false]
  --namingStrategy       Use custom naming strategy
  --relationIds          Generate RelationId fields   [boolean] [default: false]
  --generateConstructor  Generate constructor allowing partial initialization
                                                      [boolean] [default: false]
```
### Examples

* Creating model from local MSSQL database
   * Global module
      ```
      typeorm-model-generator -h localhost -d tempdb -u sa -x !Passw0rd -e mssql -o .
      ````
   * Npx Way
      ```
      npx typeorm-model-generator -h localhost -d tempdb -u sa -x !Passw0rd -e mssql -o .
      ````
* Creating model from local Postgres database, public schema with ssl connection
   * Global module
      ```
      typeorm-model-generator -h localhost -d postgres -u postgres -x !Passw0rd -e postgres -o . -s public --ssl
      ````
   * Npx Way
      ```
      npx typeorm-model-generator -h localhost -d postgres -u postgres -x !Passw0rd -e postgres -o . -s public --ssl
      ````
* Creating model from SQLite database
   * Global module
      ```
      typeorm-model-generator -d "Z:\sqlite.db" -e sqlite -o .
      ````
   * Npx Way
      ```
      npx typeorm-model-generator -d "Z:\sqlite.db" -e sqlite -o .
      ````
## Naming strategy
If you want to generate custom names for properties in generated entities you need to use custom naming strategy. You need to create your own version of [NamingStrategy](https://github.com/Kononnable/typeorm-model-generator/blob/master/src/NamingStrategy.ts) and pass it as command parameter.

```typeorm-model-generator -d typeorm_mg --namingStrategy=./NamingStrategy -e sqlite -db /tmp/sqliteto.db```
