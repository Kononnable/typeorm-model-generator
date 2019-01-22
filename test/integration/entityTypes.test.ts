require('dotenv').config()
import { expect } from "chai";
import fs = require('fs-extra');
import path = require('path')
import "reflect-metadata";
import { EntityFileToJson } from "../utils/EntityFileToJson";
import chai = require('chai');
import chaiSubset = require('chai-subset');
import * as ts from "typescript";
import { createDriver, createModelFromDatabase } from "../../src/Engine";
import * as GTU from "../utils/GeneralTestUtils"

chai.use(chaiSubset);

describe("Platform specyfic types", async function () {
    this.timeout(30000)
    this.slow(5000)// compiling created models takes time

    const dbDrivers: string[] = GTU.getEnabledDbDrivers();

    const examplesPathJS = path.resolve(process.cwd(), 'dist/test/integration/entityTypes')
    const examplesPathTS = path.resolve(process.cwd(), 'test/integration/entityTypes')
    const files = fs.readdirSync(examplesPathTS)

    for (const dbDriver of dbDrivers) {
        for (const folder of files) {
            if (dbDriver == folder) {
                it(dbDriver, async function () {

                    const filesOrgPathJS = path.resolve(examplesPathJS, folder, 'entity')
                    const filesOrgPathTS = path.resolve(examplesPathTS, folder, 'entity')
                    const resultsPath = path.resolve(process.cwd(), `output`)
                    fs.removeSync(resultsPath)

                    const driver = createDriver(dbDriver);
                    const connectionOptions = await GTU.createModelsInDb(dbDriver, filesOrgPathJS);
                    const generationOptions = GTU.getGenerationOptions(resultsPath);

                    await createModelFromDatabase(driver,connectionOptions,generationOptions)
                    const filesGenPath = path.resolve(resultsPath, 'entities')

                    const filesOrg = fs.readdirSync(filesOrgPathTS).filter((val) => val.toString().endsWith('.ts'))
                    const filesGen = fs.readdirSync(filesGenPath).filter((val) =>  val.toString().endsWith('.ts'))

                    expect(filesOrg, 'Errors detected in model comparision').to.be.deep.equal(filesGen)

                    for (const file of filesOrg) {
                        const entftj = new EntityFileToJson();
                        const jsonEntityOrg = entftj.convert(fs.readFileSync(path.resolve(filesOrgPathTS, file)))
                        const jsonEntityGen = entftj.convert(fs.readFileSync(path.resolve(filesGenPath, file)))
                        expect(jsonEntityGen, `Error in file ${file}`).to.containSubset(jsonEntityOrg)
                    }
                    const currentDirectoryFiles = fs.readdirSync(filesGenPath).
                        filter(fileName => fileName.length >= 3 && fileName.substr(fileName.length - 3, 3) === ".ts").map(v =>  path.resolve(filesGenPath, v))
                    const compileErrors = GTU.compileTsFiles(currentDirectoryFiles, {
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
        }
    }
})
