# Changelog

* added option to generate models based on multiple databases(#144)
* fixed generation of ManyToMany relations on junction tables with custom names(#151)
* fixed problems with mysql 8
* fixed shadowed variables tslint errors( #141)
* fixed generated columns order

## 0.3.1
* Fixed npx ussage(#146)

# 0.3.0
* Wizard mode - you can now run model generation without passing any parameters and provide them step by step. It also allows you to save provided informations for future use
* generated columns no longer contains options which are set by default in typeorm
* added support for VARBINARY type on MySQL, MariaDb
* fixed issue with case convertion and @RetlationId fields
* a lot of internal work

## 0.2.25
* fixed naming strategy changing entity name in db
* fixed proper relation generation when unique index have more columns

## 0.2.24
* fixed generation of default values
* fixed generation of duplicate relations for mysql
* added option for generating entities for AciveRecord pattern

## 0.2.23
* added column type to generated `@PrimaryGeneratedColumn` decorator
* allow to define property visibility, by using --pv
* fixed some problems with duplicated relationships on mysql database

## 0.2.22
* fixed naming stategy for guid ended column names
* fixed column names case convertion in index declarations

## 0.2.21
* primary keys using identity/sequence are now generated with `@PrimaryGeneratedColumn` decorator [#96](https://github.com/Kononnable/typeorm-model-generator/issues/96)

## 0.2.20
* relation onUpdate fixes
* postgres support for citext, hstore, geometry, array column types
* upgraded typeorm version

## 0.2.19
* custom naming strategy fiexes
* dependencies update

## 0.2.18
* oracle output format fixed

## 0.2.17

* added support for relationId fields
* added support for custom naming entity fields
* removed oracledb from dependencies
* generating nullable column types for nullable columns
