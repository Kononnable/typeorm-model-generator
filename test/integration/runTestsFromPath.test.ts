require('dotenv').config()
import "reflect-metadata";
import { expect } from "chai";
import fs = require('fs-extra');
import path = require('path');
import { EntityFileToJson } from "../utils/EntityFileToJson";
import { createDriver, createModelFromDatabase, dataCollectionPhase, modelCustomizationPhase, modelGenerationPhase } from "../../src/Engine";
import * as ts from "typescript";
import * as GTU from "../utils/GeneralTestUtils"
import chaiSubset = require('chai-subset');
import chai = require('chai');

chai.use(chaiSubset);

describe("Column default values", async function () {
    const testPartialPath = 'test/integration/defaultValues'
    this.timeout(30000)
    this.slow(5000)// compiling created models takes time
    runTestsFromPath(testPartialPath, true);
})
describe("Platform specyfic types", async function () {
    this.timeout(30000)
    this.slow(5000)// compiling created models takes time
    const testPartialPath = 'test/integration/entityTypes'
    runTestsFromPath(testPartialPath, true);
})
describe("GitHub issues", async function () {
    this.timeout(60000)
    this.slow(30000)// compiling created models takes time
    const testPartialPath = 'test/integration/github-issues'
    runTestsFromPath(testPartialPath, false);
})
describe("TypeOrm examples", async function () {
    this.timeout(60000)
    this.slow(30000)// compiling created models takes time
    const testPartialPath = 'test/integration/examples'
    runTestsFromPath(testPartialPath, false);
})

export function runTestsFromPath(testPartialPath: string, isDbSpecific: boolean) {
    const resultsPath = path.resolve(process.cwd(), `output`)
    if (!fs.existsSync(resultsPath)) {
        fs.mkdirSync(resultsPath);
    }
    const dbDrivers: string[] = GTU.getEnabledDbDrivers();
    for (const dbDriver of dbDrivers) {
        const newDirPath = path.resolve(resultsPath, dbDriver)
        if (!fs.existsSync(newDirPath)) {
            fs.mkdirSync(newDirPath);
        }
    }
    const files = fs.readdirSync(path.resolve(process.cwd(), testPartialPath));
    if (isDbSpecific) {
        for (const dbDriver of dbDrivers) {
            for (const folder of files) {
                if (dbDriver == folder) {
                   runTest(dbDriver, testPartialPath, folder);
                }
            }
        }
    } else {
        for (const folder of files) {
            runTestForMultipleDrivers(folder, dbDrivers, testPartialPath);
        }
    }
}
function runTestForMultipleDrivers(testName: string, dbDrivers: string[], testPartialPath: string) {
    it(testName, async function () {
        const driversToRun = selectDriversForSpecyficTest();
        const modelGenerationPromises = driversToRun.map(async (dbDriver) => {
            const { generationOptions, driver, connectionOptions, resultsPath, filesOrgPathTS } = await prepareTestRuns(testPartialPath, testName, dbDriver);
            let dbModel = await dataCollectionPhase(driver, connectionOptions);
            dbModel = modelCustomizationPhase(dbModel, generationOptions);
            const filesGenPath = path.resolve(resultsPath, 'entities');
            modelGenerationPhase(connectionOptions, generationOptions, dbModel);
            compareGeneratedFiles(filesOrgPathTS, filesGenPath);
            compileGeneratedModel(filesGenPath);
            return { dbModel, generationOptions, connectionOptions, resultsPath, filesOrgPathTS, dbDriver };
        })
        ///TODO: Find first generated result and compile, compare only it
        //       Then when all db drivers finished compare only generated dbModels to the first one


        //const firstResult = await Promise.race(modelGenerationPromises);
         const generatedData = await Promise.all(modelGenerationPromises)
        // for (const iterator of generatedData) {

        //     const filesGenPath = path.resolve(iterator.resultsPath, 'entities');
        //     modelGenerationPhase(iterator.connectionOptions, iterator.generationOptions, iterator.dbModel);
        //   //  compareGeneratedFiles(iterator.filesOrgPathTS, filesGenPath);
        //   //  compileGeneratedModel(filesGenPath);
        // }
        // //expect(generatedData[1].dbModel).to.be.deep.eq(generatedData[2].dbModel, `Gennerated models differ for ${generatedData[1].dbDriver} and ${generatedData[2].dbDriver} `)
        // for (const driverResult of generatedData) {
        //     expect(firstResult.dbModel).to.be.deep.eq(driverResult.dbModel, `Gennerated models differ for ${firstResult.dbDriver} and ${driverResult.dbDriver} `)
        // }
    });

    function selectDriversForSpecyficTest() {
        switch (testName) {
            case '39':
                return dbDrivers.filter(dbDriver => !['mysql', 'mariadb', 'oracle', 'sqlite'].includes(dbDriver))
            default:
                return dbDrivers;
        }
    }
}

function runTest(dbDriver: string, testPartialPath: string, testName: string) {
    it(dbDriver, async function () {
        const { generationOptions, driver, connectionOptions, resultsPath, filesOrgPathTS } = await prepareTestRuns(testPartialPath, testName, dbDriver);
        await createModelFromDatabase(driver, connectionOptions, generationOptions);
        const filesGenPath = path.resolve(resultsPath, 'entities');
        compareGeneratedFiles(filesOrgPathTS, filesGenPath);
        compileGeneratedModel(filesGenPath);
    });
}

function compareGeneratedFiles(filesOrgPathTS: string, filesGenPath: string) {
    const filesOrg = fs.readdirSync(filesOrgPathTS).filter((val) => val.toString().endsWith('.ts'));
    const filesGen = fs.readdirSync(filesGenPath).filter((val) => val.toString().endsWith('.ts'));
    expect(filesOrg, 'Errors detected in model comparision').to.be.deep.equal(filesGen);
    for (const file of filesOrg) {
        const entftj = new EntityFileToJson();
        const jsonEntityOrg = entftj.convert(fs.readFileSync(path.resolve(filesOrgPathTS, file)));
        const jsonEntityGen = entftj.convert(fs.readFileSync(path.resolve(filesGenPath, file)));
        expect(jsonEntityGen, `Error in file ${file}`).to.containSubset(jsonEntityOrg);
    }
}

function compileGeneratedModel(filesGenPath: string) {
    const currentDirectoryFiles = fs.readdirSync(filesGenPath).
        filter(fileName => fileName.length >= 3 && fileName.substr(fileName.length - 3, 3) === ".ts").map(v => path.resolve(filesGenPath, v));
    const compileErrors = GTU.compileTsFiles(currentDirectoryFiles, {
        experimentalDecorators: true,
        sourceMap: false,
        emitDecoratorMetadata: true,
        target: ts.ScriptTarget.ES2016,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        module: ts.ModuleKind.CommonJS
    });
    expect(compileErrors, 'Errors detected while compiling generated model').to.be.false;
}

async function prepareTestRuns(testPartialPath: string, testName: string, dbDriver: string) {
    const filesOrgPathJS = path.resolve(process.cwd(), 'dist', testPartialPath, testName, 'entity');
    const filesOrgPathTS = path.resolve(process.cwd(), testPartialPath, testName, 'entity');
    const resultsPath = path.resolve(process.cwd(), `output`, dbDriver);
    fs.removeSync(resultsPath);
    const driver = createDriver(dbDriver);
    const connectionOptions = await GTU.createModelsInDb(dbDriver, filesOrgPathJS);
    const generationOptions = GTU.getGenerationOptions(resultsPath);
    switch (testName) {
        case '65':
            generationOptions.relationIds = true;
            break;
        case 'sample18-lazy-relations':
            generationOptions.lazy = true;
            break;
        default:
            break;
    }
    return { generationOptions, driver, connectionOptions, resultsPath, filesOrgPathTS };
}

