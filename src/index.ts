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
var standardPort: number;
switch (argv.e) {
    case 'mssql':
        driver = new MssqlDriver();
        standardPort = 1433;
        break;
    default:
        console.error('Database engine not recognized.')
        process.abort();
        throw new Error('Database engine not recognized.');
}

let engine = new Engine(
    driver,{
        host: argv.h,
        port: parseInt(argv.p) || standardPort,
        databaseName: argv.d,
        user: argv.u,
        password: argv.x
    });

console.log(`[${new Date().toLocaleTimeString()}] Starting creation of model classes.`);
engine.createModelFromDatabase().then( ()=>{
        // process.abort();
        console.info(`[${new Date().toLocaleTimeString()}] Typeorm model classes created.`)
})
