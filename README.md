# typeorm-model-generator

[![Greenkeeper badge](https://badges.greenkeeper.io/Kononnable/typeorm-model-generator.svg)](https://greenkeeper.io/)
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
