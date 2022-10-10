# typeorm-model-generator

## 说明
- 这个工具这里增加了一些自定义的代码
- 文件名增加snakeCase命名

[![npm version](https://badge.fury.io/js/typeorm-model-generator.svg)](https://badge.fury.io/js/typeorm-model-generator)
[![codecov](https://codecov.io/gh/Kononnable/typeorm-model-generator/branch/master/graph/badge.svg)](https://codecov.io/gh/Kononnable/typeorm-model-generator)

***
## :warning: This project is in a maintenance phase. See [#329](https://github.com/Kononnable/typeorm-model-generator/issues/329) for details.
***
Generates models for TypeORM from existing databases.
Supported db engines:
* Microsoft SQL Server
* PostgreSQL
* MySQL
* MariaDB
* Oracle Database
* SQLite


## 变更记录

### 0.1.3
+ 对mysql针对表注释的获取，并在对应的实体类增加了相应的注释说明，其它数据库未加


### 0.1.2
* 更新typeorm版本为0.3.10
* 修改注释错误
* 增加字段注释
### 0.0.9
* 更新typeorm版本为0.3.9
### 0.0.8
+ 增加表名与(select字段或Order类型定义)
### 0.0.6
* 发布到NPM的版本，增加复制readme.md
### 0.0.5
* 升极依赖库的版本, 主要是将typeorm升级到了0.3.7 部分数据库升级了小版本

### 0.0.4
+ 生成的实体文件，增加where和record类型定义，便于使用。这个需要typeorm 0.3.x及以上版本，才有。0.2.x请不要使用。
### 0.0.3
+ 工具导出的表名文件名支持snake命令方式 即表名为：sampleTable => sample_table.ts
+ 优化了perttier格式代的规则

### 0.0.1
* 将typeorm-model-generator改为tmg，在命令行输入tmg就可以了
* 从typeorm-model-generator这个迁移过来，包名改为@zdhsoft/tmg

## Installation

### Versions
Typeorm-model-generator comes with preinstalled driver for each supported db(except for oracle). However if you want to use it as a dev-dependency you may want to install your db driver manually to reduce dependency footprint, reduce time spent in the CI. In such case you can use version without preinstalled db drivers - `npm i @zdhsoft@tmg@no-engines`.
### Global module
To install module globally simply type `npm i -g @zdhsoft/tmg` in your console.
### Npx way
Thanks to npx you can use npm modules without polluting global installs. So nothing to do here :)
>To use `npx` you need to use npm at version at least 5.2.0. Try updating your npm by `npm i -g npm`
### Database drivers
All database drivers except oracle are installed by default. To use typeorm-model-generator with oracle database you need to install driver with `npm i oracledb` and configure [oracle install client](http://www.oracle.com/technetwork/database/database-technologies/instant-client/overview/index.html) on your machine.

## Usage
There are two way to use this utility:
- Use step by step wizard which will guide you though the process - just type `npx tmg` in your console.
- Provide all parameters through command line(examples below)


Use `npx tmg --help` to see all available parameters with their descriptions. Some basic parameters below:
```shell
Usage: tmg -h <host> -d <database> -p [port] -u <user> -x [password] -e [engine]
You can also run program without specifying any parameters.

选项：
      --help                       显示帮助信息                           [布尔]
      --version                    显示版本号                             [布尔]
  -h, --host                       IP address/Hostname for database server [字符串] [默认值: "127.0.0.1"]
  -d, --database                   Database name(or path for sqlite). You can pass multiple values separated by comma. [字符串] [必需] [默认值: ""]
  -u, --user                       Username for database server [字符串] [默认值: ""]
  -x, --pass                       Password for database server [字符串] [默认值: ""]
  -p, --port                       Port number for database server [数字] [默认值: 0]
  -e, --engine                     Database engine [必需] [可选值: "mssql", "postgres", "mysql", "mariadb", "oracle", "sqlite"]
  -o, --output                     Where to place generated models [默认值: "./output"]
  -s, --schema                     Schema name to create model from. Only for mssql and postgres. You can pass multiple values separated by comma eg. -s scheme1,scheme2,scheme3 [字符串] [默认值: ""]
  -i, --instance                   Named instance to create model from. Only for mssql. [字符串]
      --ssl                                               [布尔] [默认值: false]
      --noConfig                   Doesn't create tsconfig.json and ormconfig.json         [布尔] [默认值: false]
      --cf, --case-file            Convert file names to specified case [可选值: "pascal", "param", "camel", "snake", "none"] [默认值: "pascal"]
      --ce, --case-entity          Convert class names to specified case [可选值: "pascal", "camel", "none"] [默认值: "pascal"]
      --cp, --case-property        Convert property names to specified case [可选值: "pascal", "camel", "snake", "none"] [默认值: "camel"]
      --eol                        Force EOL to be LF or CRLF [可选值: "LF", "CRLF"] [默认值: "CRLF"]
      --pv, --property-visibility  Defines which visibility should have the generated property [可选值: "public", "protected", "private", "none"] [默认值: "none"]
      --lazy                       Generate lazy relations[布尔] [默认值: false]
  -a, --active-record              Use ActiveRecord syntax for generated models [布尔] [默认值: false]
      --namingStrategy             Use custom naming strategy [字符串] [默认值: ""]
      --relationIds                Generate RelationId fields [布尔] [默认值: false]
      --skipSchema                 Omits schema identifier in generated entities [布尔] [默认值: false]
      --generateConstructor        Generate constructor allowing partial initialization  [布尔] [默认值: false]
      --disablePluralization       Disable pluralization of OneToMany, ManyToMany relation names  [布尔] [默认值: false]
      --skipTables                 Skip schema generation for specific tables. You can pass multiple values separated by comma [字符串] [默认值: ""]
      --tables                     Generate specific tables. You can pass multiple values separated by comma [字符串] [默认值: ""]
      --strictMode                 Mark fields as optional(?) or non-null(!) [可选值: "none", "?", "!"] [默认值: "none"]
      --index                      Generate index file    [布尔] [默认值: false]
      --defaultExport              Generate index file    [布尔] [默认值: false]

```
### Examples

* Creating model from local MSSQL database
   * Global module
      ```
      tmg -h localhost -d tempdb -u sa -x !Passw0rd -e mssql -o .
      ````
   * Npx Way
      ```
      npx tmg -h localhost -d tempdb -u sa -x !Passw0rd -e mssql -o .
      ````
* Creating model from local Postgres database, public schema with ssl connection
   * Global module
      ```
      tmg -h localhost -d postgres -u postgres -x !Passw0rd -e postgres -o . -s public --ssl
      ````
   * Npx Way
      ```
      npx tmg -h localhost -d postgres -u postgres -x !Passw0rd -e postgres -o . -s public --ssl
      ````
* Creating model from SQLite database
   * Global module
      ```
      tmg -d "Z:\sqlite.db" -e sqlite -o .
      ````
   * Npx Way
      ```
      npx tmg -d "Z:\sqlite.db" -e sqlite -o .
      ````
## Use Cases
Please take a look at [few workflows](USECASES.md) which might help you with deciding how you're gonna use typeorm-model-generator.
## Naming strategy
If you want to generate custom names for properties in generated entities you need to use custom naming strategy. You need to create your own version of [NamingStrategy](https://github.com/Kononnable/typeorm-model-generator/blob/master/src/NamingStrategy.ts) and pass it as command parameter.

```tmg -d typeorm_mg --namingStrategy=./NamingStrategy -e sqlite -db /tmp/sqliteto.db```
