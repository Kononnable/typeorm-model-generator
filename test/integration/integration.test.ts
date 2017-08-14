require('dotenv').config()
import "reflect-metadata";
import { createConnection, ConnectionOptions, Connection } from "typeorm";
import fs = require('fs-extra');
import path = require('path')
import { Engine } from "./../../src/Engine";
import { AbstractDriver } from "./../../src/drivers/AbstractDriver";
import { MssqlDriver } from "./../../src/drivers/MssqlDriver";
import { DriverType } from "typeorm/driver/DriverOptions";
import { expect } from "chai";
import * as Sinon from 'sinon'
import { EntityFileToJson } from "../utils/EntityFileToJson";
var chai = require('chai');
var chaiSubset = require('chai-subset');
import * as ts from "typescript";
import { PostgresDriver } from "../../src/drivers/PostgresDriver";
import { MysqlDriver } from "../../src/drivers/MysqlDriver";
import { MariaDbDriver } from "../../src/drivers/MariaDbDriver";


chai.use(chaiSubset);


describe("integration tests", async function () {
    this.timeout(20000)
    this.slow(5000)//compiling created models takes time
    let examplesPathJS = path.resolve(process.cwd(), 'dist/test/integration/examples')
    let examplesPathTS = path.resolve(process.cwd(), 'test/integration/examples')
    let files = fs.readdirSync(examplesPathTS)

    let dbDrivers: DriverType[] = []
    if (process.env.MSSQL_Skip == '0') dbDrivers.push('mssql')
    if (process.env.POSTGRES_Skip == '0') dbDrivers.push('postgres')
    if (process.env.MYSQL_Skip == '0') dbDrivers.push('mysql')
    if (process.env.MARIADB_Skip == '0') dbDrivers.push('mariadb')

    for (let folder of files) {

        describe(folder, async function () {
            for (let dbDriver of dbDrivers) {
                it(dbDriver, async function () {

                    let filesOrgPathJS = path.resolve(examplesPathJS, folder, 'entity')
                    let filesOrgPathTS = path.resolve(examplesPathTS, folder, 'entity')
                    let resultsPath = path.resolve(process.cwd(), `output`)
                    fs.removeSync(resultsPath)

                    let engine: Engine;
                    switch (dbDriver) {
                        case 'mssql':
                            engine = await createMSSQLModels(filesOrgPathJS, resultsPath)
                            break;
                        case 'postgres':
                            engine = await createPostgresModels(filesOrgPathJS, resultsPath)
                            break;
                        case 'mysql':
                            engine = await createMysqlModels(filesOrgPathJS, resultsPath)
                            break;
                        case 'mariadb':
                            engine = await createMariaDBModels(filesOrgPathJS, resultsPath)
                            break;

                        default:
                            console.log(`Unknown engine type`);
                            engine = <Engine>{}
                            break;
                    }


                    let result = await engine.createModelFromDatabase()

                    let filesGenPath = path.resolve(resultsPath, 'entities')

                    let filesOrg = fs.readdirSync(filesOrgPathTS).filter(function (this, val, ind, arr) { return val.toString().endsWith('.ts') })
                    let filesGen = fs.readdirSync(filesGenPath).filter(function (this, val, ind, arr) { return val.toString().endsWith('.ts') })

                    expect(filesOrg, 'Errors detected in model comparision').to.be.deep.equal(filesGen)

                    for (let file of filesOrg) {
                        let entftj = new EntityFileToJson();
                        let jsonEntityOrg = entftj.convert(fs.readFileSync(path.resolve(filesOrgPathTS, file)))
                        let jsonEntityGen = entftj.convert(fs.readFileSync(path.resolve(filesGenPath, file)))
                        expect(jsonEntityGen, `Error in file ${file}`).to.containSubset(jsonEntityOrg)
                    }
                    const currentDirectoryFiles = fs.readdirSync(filesGenPath).
                        filter(fileName => fileName.length >= 3 && fileName.substr(fileName.length - 3, 3) === ".ts").map(v => {
                            return path.resolve(filesGenPath, v)
                        })
                    let compileErrors = compileTsFiles(currentDirectoryFiles, {

                        experimentalDecorators: true,
                        sourceMap: false,
                        emitDecoratorMetadata: true,
                        target: ts.ScriptTarget.ES2016,
                        moduleResolution: ts.ModuleResolutionKind.NodeJs,
                        module: ts.ModuleKind.CommonJS
                    });
                    expect(compileErrors, 'Errors detected while compiling generated model').to.be.false;
                });

            }
        })
    }
})

async function createMSSQLModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {

    let driver: AbstractDriver;
    driver = new MssqlDriver();
    await driver.ConnectToServer(`master`, process.env.MSSQL_Host, process.env.MSSQL_Port, process.env.MSSQL_Username, process.env.MSSQL_Password);

    if (! await driver.CheckIfDBExists(process.env.MSSQL_Database))
        await driver.CreateDB(process.env.MSSQL_Database);
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        driver: {
            database: process.env.MSSQL_Database,
            host: process.env.MSSQL_Host,
            password: process.env.MSSQL_Password,
            type: 'mssql',
            username: process.env.MSSQL_Username,
            port: process.env.MSSQL_Port
        },
        dropSchemaOnConnection: true,
        autoSchemaSync: true,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }
    let conn = await createConnection(connOpt)

    if (conn.isConnected)
        await conn.close()


    driver = new MssqlDriver();
    let engine = new Engine(
        driver, {
            host: process.env.MSSQL_Host,
            port: process.env.MSSQL_Port,
            databaseName: process.env.MSSQL_Database,
            user: process.env.MSSQL_Username,
            password: process.env.MSSQL_Password,
            databaseType: 'mssql',
            resultsPath: resultsPath
        });


    return engine;
}

async function createPostgresModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {
    let driver: AbstractDriver;
    driver = new PostgresDriver();
    await driver.ConnectToServer(`postgres`, process.env.POSTGRES_Host, process.env.POSTGRES_Port, process.env.POSTGRES_Username, process.env.POSTGRES_Password);

    if (! await driver.CheckIfDBExists(process.env.POSTGRES_Database))
        await driver.CreateDB(process.env.POSTGRES_Database);
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        driver: {
            database: process.env.POSTGRES_Database,
            host: process.env.POSTGRES_Host,
            password: process.env.POSTGRES_Password,
            type: 'postgres',
            username: process.env.POSTGRES_Username,
            port: process.env.POSTGRES_Port
        },
        dropSchemaOnConnection: true,
        autoSchemaSync: true,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }
    let conn = await createConnection(connOpt)

    if (conn.isConnected)
        await conn.close()

    driver = new PostgresDriver();
    let engine = new Engine(
        driver, {
            host: process.env.POSTGRES_Host,
            port: process.env.POSTGRES_Port,
            databaseName: process.env.POSTGRES_Database,
            user: process.env.POSTGRES_Username,
            password: process.env.POSTGRES_Password,
            databaseType: 'postgres',
            resultsPath: resultsPath
        });



    return engine;
}

async function createMysqlModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {
    let driver: AbstractDriver;
    driver = new MysqlDriver();
    await driver.ConnectToServer(`mysql`, process.env.MYSQL_Host, process.env.MYSQL_Port, process.env.MYSQL_Username, process.env.MYSQL_Password);

    if (! await driver.CheckIfDBExists(process.env.MYSQL_Database))
        await driver.CreateDB(process.env.MYSQL_Database);
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        driver: {
            database: process.env.MYSQL_Database,
            host: process.env.MYSQL_Host,
            password: process.env.MYSQL_Password,
            type: 'mysql',
            username: process.env.MYSQL_Username,
            port: process.env.MYSQL_Port
        },
        dropSchemaOnConnection: true,
        autoSchemaSync: true,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }
    let conn = await createConnection(connOpt)

    if (conn.isConnected)
        await conn.close()

    driver = new MysqlDriver();
    let engine = new Engine(
        driver, {
            host: process.env.MYSQL_Host,
            port: process.env.MYSQL_Port,
            databaseName: process.env.MYSQL_Database,
            user: process.env.MYSQL_Username,
            password: process.env.MYSQL_Password,
            databaseType: 'mysql',
            resultsPath: resultsPath
        });



    return engine;
}
async function createMariaDBModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {
    let driver: AbstractDriver;
    driver = new MariaDbDriver();
    await driver.ConnectToServer(`mysql`, process.env.MARIADB_Host, process.env.MARIADB_Port, process.env.MARIADB_Username, process.env.MARIADB_Password);

    if (! await driver.CheckIfDBExists(process.env.MARIADB_Database))
        await driver.CreateDB(process.env.MARIADB_Database);
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        driver: {
            database: process.env.MARIADB_Database,
            host: process.env.MARIADB_Host,
            password: process.env.MARIADB_Password,
            type: 'mariadb',
            username: process.env.MARIADB_Username,
            port: process.env.MARIADB_Port
        },
        dropSchemaOnConnection: true,
        autoSchemaSync: true,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }
    let conn = await createConnection(connOpt)

    if (conn.isConnected)
        await conn.close()

    driver = new MariaDbDriver();
    let engine = new Engine(
        driver, {
            host: process.env.MARIADB_Host,
            port: process.env.MARIADB_Port,
            databaseName: process.env.MARIADB_Database,
            user: process.env.MARIADB_Username,
            password: process.env.MARIADB_Password,
            databaseType: 'mariadb',
            resultsPath: resultsPath
        });



    return engine;
}

function compileTsFiles(fileNames: string[], options: ts.CompilerOptions): boolean {
    let program = ts.createProgram(fileNames, options);
    let emitResult = program.emit();
    let compileErrors = false;
    let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        let lineAndCharacter = diagnostic.file!.getLineAndCharacterOfPosition(diagnostic.start!);
        let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        console.log(`${diagnostic.file!.fileName} (${lineAndCharacter.line + 1},${lineAndCharacter.character + 1}): ${message}`);
        compileErrors = true;
    });

    return compileErrors;
}