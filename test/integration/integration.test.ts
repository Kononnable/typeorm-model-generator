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


chai.use(chaiSubset);


describe("integration tests", async function () {
    this.timeout(10000)
    this.slow(5000)//compiling created models takes time
    let examplesPathJS = path.resolve(process.cwd(), 'dist/test/integration/examples')
    let examplesPathTS = path.resolve(process.cwd(), 'test/integration/examples')
    let files = fs.readdirSync(examplesPathTS)

    let dbDrivers: DriverType[] = []
    if (process.env.MSSQL_Skip == '0') dbDrivers.push('mssql')
    if (process.env.POSTGRES_Skip == '0') dbDrivers.push('postgres')

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
                        default:
                            console.log(`Unknown engine type`);
                            engine=<Engine>{}
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

    let driver: AbstractDriver;
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

    let driver: AbstractDriver;
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