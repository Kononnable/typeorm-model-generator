import { MssqlDriver } from './drivers/MssqlDriver';
import * as Mustache from 'mustache'
import { Engine } from './Engine'
import * as Yargs from 'yargs'
import { AbstractDriver } from "./drivers/abstractDriver";
// var x = Mustache.render("{{a}}", { a: 'test' });
// console.log(x);



var argv = Yargs
    .usage('Usage: typeorm-model-generator -h <host> -d <database> -p [port] -u <user> -x [password] -e [engine]')
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
        demand: true
    })
    .option('p', {
        alias: 'port',
        describe: 'Port number for database server.',
    })
    .option('e', {
        alias: 'engine',
        describe: 'Database engine.',
        choices: ['mssql'],
        default: 'mssql'
    })
    .argv;


var driver: AbstractDriver;
var standardPort:string;
switch (argv.e) {
    case 'mssql':
        driver = new MssqlDriver();
        standardPort=''
        break;

    default:
        driver = new MssqlDriver();
        standardPort=''
        break;
}

let engine = new Engine(
    {
        host:argv.h,
    port:argv.p || standardPort,
    databaseName:argv.d,
    user:argv.u,
    password:argv.x
    }, driver);
// if(Yargs.)
engine.createModelFromDatabase();

