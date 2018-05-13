require('dotenv').config()
import "reflect-metadata";
import fs = require('fs-extra');
import path = require('path')
import { Engine } from "./../../src/Engine";
import { expect } from "chai";
import { EntityFileToJson } from "../utils/EntityFileToJson";
var chai = require('chai');
var chaiSubset = require('chai-subset');
import * as ts from "typescript";
import * as GTU from "../utils/GeneralTestUtils"

chai.use(chaiSubset);

describe("TypeOrm examples", async function () {
    this.timeout(30000)
    this.slow(5000)//compiling created models takes time

    let dbDrivers: string[] = []
    if (process.env.SQLITE_Skip == '0') dbDrivers.push('sqlite')
    if (process.env.POSTGRES_Skip == '0') dbDrivers.push('postgres')
    if (process.env.MYSQL_Skip == '0') dbDrivers.push('mysql')
    if (process.env.MARIADB_Skip == '0') dbDrivers.push('mariadb')
    if (process.env.MSSQL_Skip == '0') dbDrivers.push('mssql')
    if (process.env.ORACLE_Skip == '0') dbDrivers.push('oracle')

    let examplesPathJS = path.resolve(process.cwd(), 'dist/test/integration/examples')
    let examplesPathTS = path.resolve(process.cwd(), 'test/integration/examples')
    let files = fs.readdirSync(examplesPathTS)

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
                        case 'sqlite':
                            engine = await GTU.createSQLiteModels(filesOrgPathJS, resultsPath)
                            break;
                        case 'postgres':
                            engine = await GTU.createPostgresModels(filesOrgPathJS, resultsPath)
                            break;
                        case 'mysql':
                            engine = await GTU.createMysqlModels(filesOrgPathJS, resultsPath)
                            break;
                        case 'mariadb':
                            engine = await GTU.createMariaDBModels(filesOrgPathJS, resultsPath)
                            break;
                        case 'mssql':
                            engine = await GTU.createMSSQLModels(filesOrgPathJS, resultsPath)
                            break;
                        case 'oracle':
                            engine = await GTU.createOracleDBModels(filesOrgPathJS, resultsPath)
                            break;
                        default:
                            console.log(`Unknown engine type`);
                            engine = <Engine>{}
                            break;
                    }
                    if (folder == 'sample18-lazy-relations') {
                        engine.Options.lazy = true;
                    }

                    await engine.createModelFromDatabase()
                    let filesGenPath = path.resolve(resultsPath, 'entities')

                    let filesOrg = fs.readdirSync(filesOrgPathTS).filter(function (this, val) { return val.toString().endsWith('.ts') })
                    let filesGen = fs.readdirSync(filesGenPath).filter(function (this, val) { return val.toString().endsWith('.ts') })

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
                    let compileErrors = GTU.compileTsFiles(currentDirectoryFiles, {
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
