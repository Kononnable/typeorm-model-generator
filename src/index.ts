import path = require('path');
import * as Yargs from 'yargs';
import * as TomgUtils from './Utils';
import {Engine} from './Engine';
import {AbstractDriver} from './drivers/AbstractDriver';
import {MssqlDriver} from './drivers/MssqlDriver';
import {PostgresDriver} from './drivers/PostgresDriver';
import {MysqlDriver} from './drivers/MysqlDriver';
import {MariaDbDriver} from './drivers/MariaDbDriver';
import {OracleDriver} from './drivers/OracleDriver';

const argv = Yargs
    .usage(`Usage: typeorm-model-generator ${[
        '-h <host>',
        '-p [port]',
        '-d <database>',
        '-u <user>',
        '-x [password]',
        '-e [engine]'
    ].join(' ')}`)
    .option('h', {
        alias: 'host',
        describe: 'IP adress/Hostname for database server.',
        demand: true
    })
    .option('d', {
        alias: 'database',
        describe: 'Database name.',
        demand: true
    })
    .option('u', {
        alias: 'user',
        describe: 'Username for database server.',
        demand: true
    })
    .option('x', {
        alias: 'pass',
        describe: 'Password for database server.',
        default: ''
    })
    .option('p', {
        alias: 'port',
        describe: 'Port number for database server.'
    })
    .option('e', {
        alias: 'engine',
        describe: 'Database engine.',
        choices: ['mssql', 'postgres', 'mysql', 'mariadb'],
        default: 'mssql'
    })
    .option('o', {
        alias: 'output',
        describe: 'Where to place generated models.',
        default: path.resolve(process.cwd(), 'output')
    })
    .option('s', {
        alias: 'schema',
        describe: 'Schema name to create model from. Only for mssql and postgres.'
    })
    .option('ssl', {
        boolean: true,
        default: false
    })
    .option('i', {
        alias: 'indent',
        describe: 'Indentation level or "tab".',
        default: 2
    })
    .option('v', {
        boolean: true,
        alias: 'validator',
        describe: 'Adds "class-validator" decorators to models',
        default: true
    })
    .option('cf', {
        alias: 'case-file',
        describe: 'Convert file names to specified case',
        choices: ['pascal', 'param', 'camel', 'none'],
        default: 'pascal'
    })
    .option('ce', {
        alias: 'case-entity',
        describe: 'Convert class names to specified case',
        choices: ['pascal', 'camel', 'none'],
        default: 'pascal'
    })
    .option('cp', {
        alias: 'case-property',
        describe: 'Convert property names to specified case',
        choices: ['pascal', 'camel', 'none'],
        default: 'camel'
    }).argv;

let driver: AbstractDriver;
let port: number;
let schema: string = '';

switch (argv.e) {
    case 'mssql':
        driver = new MssqlDriver();
        port = 1433;
        schema = 'dbo';
        break;
    case 'postgres':
        driver = new PostgresDriver();
        port = 5432;
        schema = 'public';
        break;
    case 'mysql':
        driver = new MysqlDriver();
        port = 3306;
        break;
    case 'mariadb':
        driver = new MysqlDriver();
        port = 3306;
        break;
    case 'oracle':
        driver = new OracleDriver();
        port = 1521;
        break;
    default:
        TomgUtils.LogFatalError('Database engine not recognized.', false);
        throw new Error('Database engine not recognized.');
}

const engine = new Engine(driver, {
    host: argv.h,
    port: parseInt(argv.p) || port,
    databaseName: argv.d ? argv.d.toString() : null,
    user: argv.u ? argv.u.toString() : null,
    password: argv.x ? argv.x.toString() : null,
    databaseType: argv.e,
    resultsPath: argv.o ? argv.o.toString() : null,
    schemaName: argv.s ? argv.s.toString() : schema,
    ssl: argv.ssl,
    indent: argv.i,
    validator: argv.v,
    convertCaseFile: argv.cf,
    convertCaseEntity: argv.ce,
    convertCaseProperty: argv.cp
});

const now = new Date().toLocaleTimeString();
console.log(`[${now}] Creating model classes...`);

engine.createModelFromDatabase().then(entities => {
    const now = new Date().toLocaleTimeString();
    console.info(`[${now}] Done. Created ${entities.length} TypeORM model classes.`);
});
