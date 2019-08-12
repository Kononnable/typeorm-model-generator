import "reflect-metadata";
import { expect } from "chai";
import * as ts from "typescript";
import EntityFileToJson from "../utils/EntityFileToJson";
import {
    createDriver,
    dataCollectionPhase,
    modelCustomizationPhase,
    modelGenerationPhase
} from "../../src/Engine";
import * as GTU from "../utils/GeneralTestUtils";
import EntityInfo from "../../src/models/EntityInfo";
import IConnectionOptions from "../../src/IConnectionOptions";

import fs = require("fs-extra");
import path = require("path");
import chaiSubset = require("chai-subset");
import chai = require("chai");
import yn = require("yn");

require("dotenv").config();

chai.use(chaiSubset);

it("Column default values", async function() {
    const testPartialPath = "test/integration/defaultValues";
    this.timeout(60000);
    this.slow(10000); // compiling created models takes time
    await runTestsFromPath(testPartialPath, true);
});
it("Platform specyfic types", async function() {
    this.timeout(60000);
    this.slow(10000); // compiling created models takes time
    const testPartialPath = "test/integration/entityTypes";
    await runTestsFromPath(testPartialPath, true);
});
describe("GitHub issues", async function() {
    this.timeout(60000);
    this.slow(10000); // compiling created models takes time
    const testPartialPath = "test/integration/github-issues";
    await runTestsFromPath(testPartialPath, false);
});
describe("TypeOrm examples", async function() {
    this.timeout(60000);
    this.slow(10000); // compiling created models takes time
    const testPartialPath = "test/integration/examples";
    await runTestsFromPath(testPartialPath, false);
});

async function runTestsFromPath(
    testPartialPath: string,
    isDbSpecific: boolean
) {
    const resultsPath = path.resolve(process.cwd(), `output`);
    if (!fs.existsSync(resultsPath)) {
        fs.mkdirSync(resultsPath);
    }
    const dbDrivers: string[] = GTU.getEnabledDbDrivers();
    dbDrivers.forEach(dbDriver => {
        const newDirPath = path.resolve(resultsPath, dbDriver);
        if (!fs.existsSync(newDirPath)) {
            fs.mkdirSync(newDirPath);
        }
    });
    const files = fs.readdirSync(path.resolve(process.cwd(), testPartialPath));
    if (isDbSpecific) {
        await runTest(dbDrivers, testPartialPath, files);
    } else {
        files.forEach(folder => {
            runTestForMultipleDrivers(folder, dbDrivers, testPartialPath);
        });
    }
}

function runTestForMultipleDrivers(
    testName: string,
    dbDrivers: string[],
    testPartialPath: string
) {
    it(testName, async function() {
        const driversToRun = selectDriversForSpecyficTest();
        const modelGenerationPromises = driversToRun.map(async dbDriver => {
            const {
                generationOptions,
                driver,
                connectionOptions,
                resultsPath,
                filesOrgPathTS
            } = await prepareTestRuns(testPartialPath, testName, dbDriver);
            let dbModel: EntityInfo[] = [];
            switch (testName) {
                case "144":
                    dbModel = await dataCollectionPhase(
                        driver,
                        Object.assign(connectionOptions, {
                            databaseName: "db1,db2"
                        })
                    );
                    break;

                default:
                    dbModel = await dataCollectionPhase(
                        driver,
                        connectionOptions
                    );
                    break;
            }

            dbModel = modelCustomizationPhase(
                dbModel,
                generationOptions,
                driver.defaultValues
            );
            modelGenerationPhase(connectionOptions, generationOptions, dbModel);
            const filesGenPath = path.resolve(resultsPath, "entities");
            compareGeneratedFiles(filesOrgPathTS, filesGenPath);
            return {
                dbModel,
                generationOptions,
                connectionOptions,
                resultsPath,
                filesOrgPathTS,
                dbDriver
            };
        });
        await Promise.all(modelGenerationPromises);
        compileGeneratedModel(path.resolve(process.cwd(), `output`), dbDrivers);
    });

    function selectDriversForSpecyficTest() {
        switch (testName) {
            case "39":
                return dbDrivers.filter(
                    dbDriver =>
                        !["mysql", "mariadb", "oracle", "sqlite"].includes(
                            dbDriver
                        )
                );
            case "144":
                return dbDrivers.filter(dbDriver =>
                    ["mysql", "mariadb"].includes(dbDriver)
                );
            default:
                return dbDrivers;
        }
    }
}

async function runTest(
    dbDrivers: string[],
    testPartialPath: string,
    files: string[]
) {
    const modelGenerationPromises = dbDrivers
        .filter(driver => files.includes(driver))
        .map(async dbDriver => {
            const {
                generationOptions,
                driver,
                connectionOptions,
                resultsPath,
                filesOrgPathTS
            } = await prepareTestRuns(testPartialPath, dbDriver, dbDriver);
            let dbModel = await dataCollectionPhase(driver, connectionOptions);
            dbModel = modelCustomizationPhase(
                dbModel,
                generationOptions,
                driver.defaultValues
            );
            modelGenerationPhase(connectionOptions, generationOptions, dbModel);
            const filesGenPath = path.resolve(resultsPath, "entities");
            compareGeneratedFiles(filesOrgPathTS, filesGenPath);
            return {
                dbModel,
                generationOptions,
                connectionOptions,
                resultsPath,
                filesOrgPathTS,
                dbDriver
            };
        });
    await Promise.all(modelGenerationPromises);
    compileGeneratedModel(path.resolve(process.cwd(), `output`), dbDrivers);
}

function compareGeneratedFiles(filesOrgPathTS: string, filesGenPath: string) {
    const filesOrg = fs
        .readdirSync(filesOrgPathTS)
        .filter(val => val.toString().endsWith(".ts"));
    const filesGen = fs
        .readdirSync(filesGenPath)
        .filter(val => val.toString().endsWith(".ts"));
    expect(filesOrg, "Errors detected in model comparision").to.be.deep.equal(
        filesGen
    );
    filesOrg.forEach(file => {
        const jsonEntityOrg = EntityFileToJson.convert(
            fs.readFileSync(path.resolve(filesOrgPathTS, file))
        );
        const jsonEntityGen = EntityFileToJson.convert(
            fs.readFileSync(path.resolve(filesGenPath, file))
        );
        expect(jsonEntityGen, `Error in file ${file}`).to.containSubset(
            jsonEntityOrg
        );
    });
}

function compileGeneratedModel(filesGenPath: string, drivers: string[]) {
    const currentDirectoryFiles: string[] = [];
    drivers.forEach(driver => {
        const entitiesPath = path.resolve(filesGenPath, driver, "entities");
        if (fs.existsSync(entitiesPath)) {
            currentDirectoryFiles.push(
                ...fs
                    .readdirSync(entitiesPath)
                    .filter(
                        fileName =>
                            fileName.length >= 3 &&
                            fileName.substr(fileName.length - 3, 3) === ".ts"
                    )
                    .map(v => path.resolve(filesGenPath, driver, "entities", v))
            );
        }
    });
    const compileErrors = GTU.compileTsFiles(currentDirectoryFiles, {
        experimentalDecorators: true,
        sourceMap: false,
        emitDecoratorMetadata: true,
        target: ts.ScriptTarget.ES2016,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        module: ts.ModuleKind.CommonJS
    });
    expect(compileErrors, "Errors detected while compiling generated model").to
        .be.false;
}

async function prepareTestRuns(
    testPartialPath: string,
    testName: string,
    dbDriver: string
) {
    const filesOrgPathJS = path.resolve(
        process.cwd(),
        testPartialPath,
        testName,
        "entity"
    );
    const filesOrgPathTS = path.resolve(
        process.cwd(),
        testPartialPath,
        testName,
        "entity"
    );
    const resultsPath = path.resolve(process.cwd(), `output`, dbDriver);
    fs.removeSync(resultsPath);
    const driver = createDriver(dbDriver);
    const generationOptions = GTU.getGenerationOptions(resultsPath);
    switch (testName) {
        case "65":
            generationOptions.relationIds = true;
            break;
        case "sample18-lazy-relations":
            generationOptions.lazy = true;
            break;
        case "144":
            // eslint-disable-next-line no-case-declarations
            let connectionOptions: IConnectionOptions;
            switch (dbDriver) {
                case "mysql":
                    connectionOptions = {
                        host: String(process.env.MYSQL_Host),
                        port: Number(process.env.MYSQL_Port),
                        databaseName: String(process.env.MYSQL_Database),
                        user: String(process.env.MYSQL_Username),
                        password: String(process.env.MYSQL_Password),
                        databaseType: "mysql",
                        schemaName: "ignored",
                        ssl: yn(process.env.MYSQL_SSL)
                    };
                    break;
                case "mariadb":
                    connectionOptions = {
                        host: String(process.env.MARIADB_Host),
                        port: Number(process.env.MARIADB_Port),
                        databaseName: String(process.env.MARIADB_Database),
                        user: String(process.env.MARIADB_Username),
                        password: String(process.env.MARIADB_Password),
                        databaseType: "mariadb",
                        schemaName: "ignored",
                        ssl: yn(process.env.MARIADB_SSL)
                    };
                    break;

                default:
                    break;
            }

            await driver.ConnectToServer(connectionOptions!);
            if (!(await driver.CheckIfDBExists("db1"))) {
                await driver.CreateDB("db1");
            }
            if (!(await driver.CheckIfDBExists("db2"))) {
                await driver.CreateDB("db2");
            }
            await driver.DisconnectFromServer();
            break;
        default:
            break;
    }
    const connectionOptions = await GTU.createModelsInDb(
        dbDriver,
        filesOrgPathJS
    );
    return {
        generationOptions,
        driver,
        connectionOptions,
        resultsPath,
        filesOrgPathTS
    };
}
