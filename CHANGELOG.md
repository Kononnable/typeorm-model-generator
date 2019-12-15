# Changelog

## Unreleased

* change default case conversions for generated files (#196)
* enum type safety (#205)
* postgress geography type support (#232)

## 0.3.5

* moved to ts-node - you can now use this library installed directly from github repo
* support for UNSIGNED columns in MySQL (#179)
* support for richer derivation of column & entity name (#176)
* new option to generate code compliant with `strictPropertyInitialization` flag(#136, #182)
* new option to skip schema and database identifier in generated entities (#177)
* new option to specify request timeout (#185)
* added property visibility to RelationId properties (#167)
* disabled generating complex relationships(until #117 is fixed)
* fixed issue with setting precision when scale isn't default on numeric types (#184)
* PostgreSQL enum support (#187)
* generating access modifier to constructor (#169)
* fixed RelationId generation with different casing scenarios (#192)

## 0.3.4

* fixed using property case on uppercase columns(#157)

## 0.3.3

* added bit type support for mysql/mariadb
* fixed generation of relations with only onUpdate defined(#139)

## 0.3.2
* added option to generate models based on multiple databases(#144)
* fixed generation of ManyToMany relations on junction tables with custom names(#151)
* fixed problems with mysql 8
* fixed shadowed variables tslint errors(#141)
* fixed order of generated columns
* mariadb default value compatibility changes(#153)

## 0.3.1
* Fixed npx usage(#146)

# 0.3.0
* Wizard mode - you can now run model generation without passing any parameters and provide them step by step. It also allows you to save provided informations for future use
* generated columns no longer contains options which are set by default in typeorm
* added support for VARBINARY type on MySQL, MariaDb
* fixed issue with case conversion and @RetlationId fields
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
* fixed naming strategy for guid ended column names
* fixed column names case conversion in index declarations

## 0.2.21
* primary keys using identity/sequence are now generated with `@PrimaryGeneratedColumn` decorator [#96](https://github.com/Kononnable/typeorm-model-generator/issues/96)

## 0.2.20
* relation onUpdate fixes
* postgres support for citext, hstore, geometry, array column types
* upgraded typeorm version

## 0.2.19
* custom naming strategy fixes
* dependencies update

## 0.2.18
* oracle output format fixed

## 0.2.17

* added support for relationId fields
* added support for custom naming entity fields
* removed oracledb from dependencies
* generating nullable column types for nullable columns
