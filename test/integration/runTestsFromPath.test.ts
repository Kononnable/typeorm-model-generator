import "reflect-metadata";
import * as chai from "chai";
import * as ts from "typescript";
import * as fs from "fs-extra";
import * as path from "path";
import * as chaiSubset from "chai-subset";
import * as flatMap from "array.prototype.flatmap";
import yn from "yn";
import { CLIEngine } from "eslint";
import EntityFileToJson from "../utils/EntityFileToJson";
import { createDriver, dataCollectionPhase } from "../../src/Engine";
import * as GTU from "../utils/GeneralTestUtils";
import { Entity } from "../../src/models/Entity";
import IConnectionOptions from "../../src/IConnectionOptions";
import modelCustomizationPhase from "../../src/ModelCustomization";
import modelGenerationPhase from "../../src/ModelGeneration";

require("dotenv").config();

flatMap.shim();
chai.use(chaiSubset);
const { expect } = chai;

it("Column default values", async () => {
    const testPartialPath = "test/integration/defaultValues";
    await runTestsFromPath(testPartialPath, true);
})
it("Platform specific types", async () => {
    const testPartialPath = "test/integration/entityTypes";
    await runTestsFromPath(testPartialPath, true);
});
describe("GitHub issues", async () => {
    const testPartialPath = "test/integration/github-issues";
    await runTestsFromPath(testPartialPath, false);
});
describe("TypeOrm examples", async () => {
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
    it(testName, async () => {
        const driversToRun = selectDriversForSpecificTest();
        const modelGenerationPromises = driversToRun.map(async dbDriver => {
            const {
                generationOptions,
                driver,
                connectionOptions,
                resultsPath,
                filesOrgPathTS
            } = await prepareTestRuns(testPartialPath, testName, dbDriver);
            let dbModel: Entity[] = [];
            switch (testName) {
                case "144":
                    dbModel = await dataCollectionPhase(
                        driver,
                        Object.assign(connectionOptions, {
                            databaseName: "db1,db2"
                        }),
                        generationOptions
                    );
                    break;

                default:
                    dbModel = await dataCollectionPhase(
                        driver,
                        connectionOptions,
                        generationOptions
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

    function selectDriversForSpecificTest() {
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
            let dbModel = await dataCollectionPhase(
                driver,
                connectionOptions,
                generationOptions
            );
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
    expect(filesOrg, "Errors detected in model comparison").to.be.deep.equal(
        filesGen
    );
    const generatedEntities = filesOrg.map(file =>
        EntityFileToJson.convert(
            fs.readFileSync(path.resolve(filesGenPath, file))
        )
    );
    const originalEntities = filesGen.map(file =>
        EntityFileToJson.convert(
            fs.readFileSync(path.resolve(filesOrgPathTS, file))
        )
    );
    generatedEntities
        .flatMap(entity =>
            entity.columns
                .filter(
                    column =>
                        column.relationType === "ManyToMany" &&
                        column.joinOptions.length > 0
                )
                .map(v => {
                    return {
                        ownerColumn: v,
                        ownerEntity: entity
                    };
                })
        )

        .forEach(({ ownerColumn, ownerEntity }) => {
            const childColumn = generatedEntities
                .find(
                    childEntity =>
                        childEntity.entityName.toLowerCase() ===
                        ownerColumn.columnTypes[0]
                            .substring(0, ownerColumn.columnTypes[0].length - 2)
                            .toLowerCase()
                )!
                .columns.find(
                    column =>
                        column.columnTypes[0].toLowerCase() ===
                        `${ownerEntity.entityName}[]`.toLowerCase()
                )!;
            childColumn.joinOptions = ownerColumn.joinOptions.map(options => {
                return {
                    ...options,
                    joinColumns: options.inverseJoinColumns,
                    inverseJoinColumns: options.joinColumns
                };
            });
        });
    // TODO: set relation options on ManyToMany to both side of relation
    generatedEntities
        .map((ent, i) => [ent, originalEntities[i], filesOrg[i]])
        .forEach(([generated, original, file]) => {
            expect(generated, `Error in file ${file}`).to.containSubset(
                original
            );
        });
}

// TODO: Move(?)
// eslint-disable-next-line import/prefer-default-export
export function compileGeneratedModel(filesGenPath: string, drivers: string[]) {
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
    const compiledWithoutErrors = GTU.compileTsFiles(currentDirectoryFiles, {
        experimentalDecorators: true,
        sourceMap: false,
        emitDecoratorMetadata: true,
        target: ts.ScriptTarget.ES2016,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        module: ts.ModuleKind.CommonJS
    });
    expect(
        compiledWithoutErrors,
        "Errors detected while compiling generated model"
    ).to.equal(true);


    const cli = new CLIEngine({ configFile: "test/configs/.eslintrc.js" });
    const lintReport = cli.executeOnFiles(currentDirectoryFiles)
    lintReport.results.forEach(result => result.messages.forEach(message => {
        console.error(`${result.filePath}:${message.line} - ${message.message}`)
    }))
    expect(lintReport.errorCount).to.equal(0)
    expect(lintReport.warningCount).to.equal(0)
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
                        ssl: yn(process.env.MYSQL_SSL, { default: false }),
                        skipTables: []
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
                        ssl: yn(process.env.MARIADB_SSL, { default: false }),
                        skipTables: []
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
