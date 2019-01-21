require('dotenv').config()
import { expect } from "chai";
import fs = require('fs-extra');
import path = require('path')
import "reflect-metadata";
import { Engine, IConnectionOptions, IGenerationOptions } from "../../src/Engine";
import { EntityFileToJson } from "../utils/EntityFileToJson";
const chai = require('chai');
const chaiSubset = require('chai-subset');
import * as ts from "typescript";
import * as GTU from "../utils/GeneralTestUtils"
import { AbstractDriver } from "../../src/drivers/AbstractDriver";

chai.use(chaiSubset);

describe("TypeOrm examples", async function () {
    this.timeout(30000)
    this.slow(5000)// compiling created models takes time


    const dbDrivers: string[] = GTU.getEnabledDbDrivers();

    const examplesPathJS = path.resolve(process.cwd(), 'dist/test/integration/examples')
    const examplesPathTS = path.resolve(process.cwd(), 'test/integration/examples')
    const files = fs.readdirSync(examplesPathTS)

    for (const folder of files) {
        describe(folder, async function () {
            for (const dbDriver of dbDrivers) {
                it(dbDriver, async function () {
                    const filesOrgPathJS = path.resolve(examplesPathJS, folder, 'entity')
                    const filesOrgPathTS = path.resolve(examplesPathTS, folder, 'entity')
                    const resultsPath = path.resolve(process.cwd(), `output`)
                    fs.removeSync(resultsPath)

                    const driver=Engine.createDriver(dbDriver);
                    const [connectionOptions, generationOptions] = await GTU.getDriverAndOptions(dbDriver, filesOrgPathJS, resultsPath);

                    if (folder == 'sample18-lazy-relations') {
                        generationOptions.lazy = true;
                    }

                    await Engine.createModelFromDatabase(driver,connectionOptions,generationOptions)
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
                        filter(fileName => fileName.length >= 3 && fileName.substr(fileName.length - 3, 3) === ".ts").map(v => path.resolve(filesGenPath, v))
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
        })
    }
})
