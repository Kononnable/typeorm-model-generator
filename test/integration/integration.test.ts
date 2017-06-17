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


chai.use(chaiSubset);


describe("integration tests", async function() {
    this.timeout(10000)
    this.slow(5000)//compiling created models takes time
    let examplesPath = path.resolve(process.cwd(), 'test/integration/examples')
    let files = fs.readdirSync(examplesPath)

    let dbDrivers: DriverType[] = []
    if (process.env.MSSQL_Skip == '0') dbDrivers.push('mssql')

    for (let folder of files) {

        describe(folder, async function() {
            for (let dbDriver of dbDrivers) {
                it(dbDriver, async function() {

                    let filesOrgPath = path.resolve(examplesPath, folder, 'entity')

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

                    let resultsPath = path.resolve(process.cwd(), `output`)
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
                    fs.removeSync(resultsPath)


                    let result = await engine.createModelFromDatabase()

                    let filesGenPath = path.resolve(resultsPath, 'entities')

                    let filesOrg = fs.readdirSync(filesOrgPath).filter(function(this, val, ind, arr) { return val.toString().endsWith('.ts') })
                    let filesGen = fs.readdirSync(filesGenPath).filter(function(this, val, ind, arr) { return val.toString().endsWith('.ts') })

                    expect(filesOrg, 'Errors detected in model comparision').to.be.deep.equal(filesGen)

                    for (let file of filesOrg) {
                        let entftj = new EntityFileToJson();
                        let jsonEntityOrg = entftj.convert(fs.readFileSync(path.resolve(filesOrgPath, file)))
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

function compileTsFiles(fileNames: string[], options: ts.CompilerOptions): boolean {
    let program = ts.createProgram(fileNames, options);
    let emitResult = program.emit();
    let compileErrors = false;
    let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        compileErrors = true;
    });

    return compileErrors;
}