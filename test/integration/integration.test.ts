require('dotenv').config()
import "reflect-metadata";
import { createConnection, ConnectionOptions, Connection } from "typeorm";
import fs = require('fs-extra');
import path = require('path')
import { Engine } from "./../../src/Engine";
import { AbstractDriver } from "./../../src/drivers/AbstractDriver";
import { MssqlDriver } from "./../../src/drivers/MssqlDriver";
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

    let dbDrivers: string[] = []
    if (process.env.POSTGRES_Skip == '0') dbDrivers.push('postgres')
    if (process.env.MYSQL_Skip == '0') dbDrivers.push('mysql')
    if (process.env.MARIADB_Skip == '0') dbDrivers.push('mariadb')
    if (process.env.MSSQL_Skip == '0') dbDrivers.push('mssql')

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
    await driver.ConnectToServer(`master`, String(process.env.MSSQL_Host), Number(process.env.MSSQL_Port), String(process.env.MSSQL_Username), String(process.env.MSSQL_Password));

    if (! await driver.CheckIfDBExists(String(process.env.MSSQL_Database)))
        await driver.CreateDB(String(process.env.MSSQL_Database));
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {

        database: String(process.env.MSSQL_Database),
        host: String(process.env.MSSQL_Host),
        password: String(process.env.MSSQL_Password),
        type: 'mssql',
        username: String(process.env.MSSQL_Username),
        port: Number(process.env.MSSQL_Port),
        dropSchema: true,
        synchronize: true,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }
    let conn = await createConnection(connOpt)

    if (conn.isConnected)
        await conn.close()


    driver = new MssqlDriver();
    let engine = new Engine(
        driver, {
            host: String(process.env.MSSQL_Host),
            port: Number(process.env.MSSQL_Port),
            databaseName: String(process.env.MSSQL_Database),
            user: String(process.env.MSSQL_Username),
            password: String(process.env.MSSQL_Password),
            databaseType: 'mssql',
            resultsPath: resultsPath,
            schemaName:'dbo'
        });


    return engine;
}

async function createPostgresModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {
    let driver: AbstractDriver;
    driver = new PostgresDriver();
    await driver.ConnectToServer(`postgres`, String(process.env.POSTGRES_Host), Number(process.env.POSTGRES_Port), String(process.env.POSTGRES_Username), String(process.env.POSTGRES_Password));

    if (! await driver.CheckIfDBExists(String(process.env.POSTGRES_Database)))
        await driver.CreateDB(String(process.env.POSTGRES_Database));
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        database: String(process.env.POSTGRES_Database),
        host: String(process.env.POSTGRES_Host),
        password: String(process.env.POSTGRES_Password),
        type: 'postgres',
        username: String(process.env.POSTGRES_Username),
        port: Number(process.env.POSTGRES_Port),
        dropSchema: true,
        synchronize: true,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }
    let conn = await createConnection(connOpt)

    if (conn.isConnected)
        await conn.close()

    driver = new PostgresDriver();
    let engine = new Engine(
        driver, {
            host: String(process.env.POSTGRES_Host),
            port: Number(process.env.POSTGRES_Port),
            databaseName: String(process.env.POSTGRES_Database),
            user: String(process.env.POSTGRES_Username),
            password: String(process.env.POSTGRES_Password),
            databaseType: 'postgres',
            resultsPath: resultsPath,
            schemaName:'public'
        });



    return engine;
}

async function createMysqlModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {
    let driver: AbstractDriver;
    driver = new MysqlDriver();
    await driver.ConnectToServer(`mysql`, String(process.env.MYSQL_Host), Number(process.env.MYSQL_Port), String(process.env.MYSQL_Username), String(process.env.MYSQL_Password));

    if (! await driver.CheckIfDBExists(String(process.env.MYSQL_Database)))
        await driver.CreateDB(String(process.env.MYSQL_Database));
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        database: String(process.env.MYSQL_Database),
        host: String(process.env.MYSQL_Host),
        password: String(process.env.MYSQL_Password),
        type: 'mysql',
        username: String(process.env.MYSQL_Username),
        port: Number(process.env.MYSQL_Port),
        dropSchema: true,
        synchronize: true,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }
    let conn = await createConnection(connOpt)

    if (conn.isConnected)
        await conn.close()

    driver = new MysqlDriver();
    let engine = new Engine(
        driver, {
            host: String(process.env.MYSQL_Host),
            port: Number(process.env.MYSQL_Port),
            databaseName: String(process.env.MYSQL_Database),
            user: String(process.env.MYSQL_Username),
            password: String(process.env.MYSQL_Password),
            databaseType: 'mysql',
            resultsPath: resultsPath,
            schemaName:'ignored'
        });



    return engine;
}
async function createMariaDBModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {
    let driver: AbstractDriver;
    driver = new MariaDbDriver();
    await driver.ConnectToServer(`mysql`, String(process.env.MARIADB_Host), Number(process.env.MARIADB_Port), String(process.env.MARIADB_Username), String(process.env.MARIADB_Password));

    if (! await driver.CheckIfDBExists(String(process.env.MARIADB_Database)))
        await driver.CreateDB(String(process.env.MARIADB_Database));
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {

        database: String(process.env.MARIADB_Database),
        host: String(process.env.MARIADB_Host),
        password: String(process.env.MARIADB_Password),
        type: 'mariadb',
        username: String(process.env.MARIADB_Username),
        port: Number(process.env.MARIADB_Port),
        dropSchema: true,
        synchronize: true,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }
    let conn = await createConnection(connOpt)

    if (conn.isConnected)
        await conn.close()

    driver = new MariaDbDriver();
    let engine = new Engine(
        driver, {
            host: String(process.env.MARIADB_Host),
            port: Number(process.env.MARIADB_Port),
            databaseName: String(process.env.MARIADB_Database),
            user: String(process.env.MARIADB_Username),
            password: String(process.env.MARIADB_Password),
            databaseType: 'mariadb',
            resultsPath: resultsPath,
            schemaName:'ignored'
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