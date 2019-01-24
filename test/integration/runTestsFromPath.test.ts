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

it("Column default values", async function () {
    const testPartialPath = 'test/integration/defaultValues'
    this.timeout(60000)
    this.slow(10000)// compiling created models takes time
    await runTestsFromPath(testPartialPath, true);
})
it("Platform specyfic types", async function () {
    this.timeout(60000)
    this.slow(10000)// compiling created models takes time
    const testPartialPath = 'test/integration/entityTypes'
    await runTestsFromPath(testPartialPath, true);
})
describe("GitHub issues", async function () {
    this.timeout(60000)
    this.slow(10000)// compiling created models takes time
    const testPartialPath = 'test/integration/github-issues'
    runTestsFromPath(testPartialPath, false);
})
describe("TypeOrm examples", async function () {
    this.timeout(60000)
    this.slow(10000)// compiling created models takes time
    const testPartialPath = 'test/integration/examples'
    runTestsFromPath(testPartialPath, false);
})

export async function runTestsFromPath(testPartialPath: string, isDbSpecific: boolean) {
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
        await runTest(dbDrivers, testPartialPath, files);
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
            dbModel = modelCustomizationPhase(dbModel, generationOptions, driver.defaultValues);
            modelGenerationPhase(connectionOptions, generationOptions, dbModel);
            const filesGenPath = path.resolve(resultsPath, 'entities');
            compareGeneratedFiles(filesOrgPathTS, filesGenPath);
            return { dbModel, generationOptions, connectionOptions, resultsPath, filesOrgPathTS, dbDriver };
        })
        await Promise.all(modelGenerationPromises)
        compileGeneratedModel(path.resolve(process.cwd(), `output`), dbDrivers);
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

async function runTest(dbDrivers: string[], testPartialPath: string, files: string[]) {

    const modelGenerationPromises = dbDrivers.filter(driver => files.includes(driver))
        .map(async dbDriver => {
            const { generationOptions, driver, connectionOptions, resultsPath, filesOrgPathTS } = await prepareTestRuns(testPartialPath, dbDriver, dbDriver);
            let dbModel = await dataCollectionPhase(driver, connectionOptions);
            dbModel = modelCustomizationPhase(dbModel, generationOptions, driver.defaultValues);
            modelGenerationPhase(connectionOptions, generationOptions, dbModel);
            const filesGenPath = path.resolve(resultsPath, 'entities');
            compareGeneratedFiles(filesOrgPathTS, filesGenPath);
            return { dbModel, generationOptions, connectionOptions, resultsPath, filesOrgPathTS, dbDriver };
        })
    await Promise.all(modelGenerationPromises)
    compileGeneratedModel(path.resolve(process.cwd(), `output`), dbDrivers);
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

function compileGeneratedModel(filesGenPath: string, drivers: string[]) {
    let currentDirectoryFiles: string[] = [];
    drivers.forEach(driver => {
        currentDirectoryFiles.push(...fs.readdirSync(path.resolve(filesGenPath, driver, "entities")).
            filter(fileName => fileName.length >= 3 && fileName.substr(fileName.length - 3, 3) === ".ts").map(v => path.resolve(filesGenPath, driver, "entities", v)));
    });
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

