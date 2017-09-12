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
  -h, --host      IP adress/Hostname for database server.             [required]
  -d, --database  Database name.                                      [required]
  -u, --user      Username for database server.                       [required]
  -x, --pass      Password for database server.                       [required]
  -p, --port      Port number for database server.
  -e, --engine    Database engine.
           [choices: "mssql", "postgres", "mysql", "mariadb"] [default: "mssql"]
  -o, --output    Where to place generated models.
  -c, --case      Convert snake_case tables names to PascalCase entities and snake_case columns to camelCase properties
```
### Examples

* Creating model from local MSSQL database
   * Global module  
      ```
      typeorm-model-generator -h localhost -d tempdb -u sa -x !Passw0rd -e mssql -o .\
      ````
   * Npx Way  
      ```
      npx typeorm-model-generator -h localhost -d tempdb -u sa -x !Passw0rd -e mssql -o .\
      ````
* Creating model from local Postgres database
   * Global module 
      ```
      typeorm-model-generator -h localhost -d postgres -u postgres -x !Passw0rd -e postgres -o .\
      ````
   * Npx Way  
      ```
      npx typeorm-model-generator -h localhost -d postgres -u postgres -x !Passw0rd -e postgres -o .\
      ````