import * as Handlebars from "handlebars";
import { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults";
import * as TomgUtils from "./Utils";
import AbstractDriver from "./drivers/AbstractDriver";
import MssqlDriver from "./drivers/MssqlDriver";
import MariaDbDriver from "./drivers/MariaDbDriver";
import IConnectionOptions from "./IConnectionOptions";
import IGenerationOptions from "./IGenerationOptions";
import EntityInfo from "./models/EntityInfo";
import PostgresDriver from "./drivers/PostgresDriver";
import MysqlDriver from "./drivers/MysqlDriver";
import OracleDriver from "./drivers/OracleDriver";
import SqliteDriver from "./drivers/SqliteDriver";
import NamingStrategy from "./NamingStrategy";
import AbstractNamingStrategy from "./AbstractNamingStrategy";

import changeCase = require("change-case");
import fs = require("fs");
import path = require("path");

export function createDriver(driverName: string): AbstractDriver {
    switch (driverName) {
        case "mssql":
            return new MssqlDriver();
        case "postgres":
            return new PostgresDriver();
        case "mysql":
            return new MysqlDriver();
        case "mariadb":
            return new MariaDbDriver();
        case "oracle":
            return new OracleDriver();
        case "sqlite":
            return new SqliteDriver();
        default:
            TomgUtils.LogError("Database engine not recognized.", false);
            throw new Error("Database engine not recognized.");
    }
}

export async function createModelFromDatabase(
    driver: AbstractDriver,
    connectionOptions: IConnectionOptions,
    generationOptions: IGenerationOptions
) {
    let dbModel = await dataCollectionPhase(driver, connectionOptions);
    if (dbModel.length === 0) {
        TomgUtils.LogError(
            "Tables not found in selected database. Skipping creation of typeorm model.",
            false
        );
        return;
    }
    dbModel = modelCustomizationPhase(
        dbModel,
        generationOptions,
        driver.defaultValues
    );
    modelGenerationPhase(connectionOptions, generationOptions, dbModel);
}
export async function dataCollectionPhase(
    driver: AbstractDriver,
    connectionOptions: IConnectionOptions
) {
    return driver.GetDataFromServer(connectionOptions);
}

export function modelCustomizationPhase(
    dbModel: EntityInfo[],
    generationOptions: IGenerationOptions,
    defaultValues: DataTypeDefaults
) {
    let namingStrategy: AbstractNamingStrategy;
    if (
        generationOptions.customNamingStrategyPath &&
        generationOptions.customNamingStrategyPath !== ""
    ) {
        // eslint-disable-next-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
        const req = require(generationOptions.customNamingStrategyPath);
        namingStrategy = new req.NamingStrategy();
    } else {
        namingStrategy = new NamingStrategy();
    }
    let retVal = setRelationId(generationOptions, dbModel);
    retVal = applyNamingStrategy(namingStrategy, retVal);
    retVal = addImportsAndGenerationOptions(retVal, generationOptions);
    retVal = removeColumnDefaultProperties(retVal, defaultValues);
    return retVal;
}
function removeColumnDefaultProperties(
    dbModel: EntityInfo[],
    defaultValues: DataTypeDefaults
) {
    if (!defaultValues) {
        return dbModel;
    }
    dbModel.forEach(entity => {
        entity.Columns.forEach(column => {
            const defVal = defaultValues[column.options.type as any];
            if (defVal) {
                if (
                    column.options.length &&
                    defVal.length &&
                    column.options.length === defVal.length
                ) {
                    column.options.length = undefined;
                }
                if (
                    column.options.precision &&
                    defVal.precision &&
                    column.options.precision === defVal.precision &&
                    column.options.scale &&
                    defVal.scale &&
                    column.options.scale === defVal.scale
                ) {
                    column.options.precision = undefined;
                    column.options.scale = undefined;
                }
                if (
                    column.options.width &&
                    defVal.width &&
                    column.options.width === defVal.width
                ) {
                    column.options.width = undefined;
                }
            }
        });
    });
    return dbModel;
}
function addImportsAndGenerationOptions(
    dbModel: EntityInfo[],
    generationOptions: IGenerationOptions
) {
    dbModel.forEach(element => {
        element.Imports = [];
        element.Columns.forEach(column => {
            column.relations.forEach(relation => {
                if (element.tsEntityName !== relation.relatedTable) {
                    element.Imports.push(relation.relatedTable);
                }
            });
        });
        element.GenerateConstructor = generationOptions.generateConstructor;
        element.IsActiveRecord = generationOptions.activeRecord;
        element.Imports.filter((elem, index, self) => {
            return index === self.indexOf(elem);
        });
        if (generationOptions.skipSchema) {
            element.Schema = undefined;
            element.Database = undefined;
        }
    });
    return dbModel;
}

function setRelationId(
    generationOptions: IGenerationOptions,
    model: EntityInfo[]
) {
    if (generationOptions.relationIds) {
        model.forEach(ent => {
            ent.Columns.forEach(col => {
                col.relations.forEach(rel => {
                    rel.relationIdField = rel.isOwner;
                });
            });
        });
    }
    return model;
}
export function modelGenerationPhase(
    connectionOptions: IConnectionOptions,
    generationOptions: IGenerationOptions,
    databaseModel: EntityInfo[]
) {
    createHandlebarsHelpers(generationOptions);
    const templatePath = path.resolve(__dirname, "entity.mst");
    const template = fs.readFileSync(templatePath, "UTF-8");
    const resultPath = generationOptions.resultsPath;
    if (!fs.existsSync(resultPath)) {
        fs.mkdirSync(resultPath);
    }
    let entitesPath = resultPath;
    if (!generationOptions.noConfigs) {
        createTsConfigFile(resultPath);
        createTypeOrmConfig(resultPath, connectionOptions);
        entitesPath = path.resolve(resultPath, "./entities");
        if (!fs.existsSync(entitesPath)) {
            fs.mkdirSync(entitesPath);
        }
    }
    const compliedTemplate = Handlebars.compile(template, {
        noEscape: true
    });
    databaseModel.forEach(element => {
        let casedFileName = "";
        switch (generationOptions.convertCaseFile) {
            case "camel":
                casedFileName = changeCase.camelCase(element.tsEntityName);
                break;
            case "param":
                casedFileName = changeCase.paramCase(element.tsEntityName);
                break;
            case "pascal":
                casedFileName = changeCase.pascalCase(element.tsEntityName);
                break;
            case "none":
                casedFileName = element.tsEntityName;
                break;
            default:
                throw new Error("Unknown case style");
        }
        const resultFilePath = path.resolve(entitesPath, `${casedFileName}.ts`);
        const rendered = compliedTemplate(element);
        fs.writeFileSync(resultFilePath, rendered, {
            encoding: "UTF-8",
            flag: "w"
        });
    });
}

function createHandlebarsHelpers(generationOptions: IGenerationOptions) {
    Handlebars.registerHelper("curly", open => (open ? "{" : "}"));
    Handlebars.registerHelper("toEntityName", str => {
        let retStr = "";
        switch (generationOptions.convertCaseEntity) {
            case "camel":
                retStr = changeCase.camelCase(str);
                break;
            case "pascal":
                retStr = changeCase.pascalCase(str);
                break;
            case "none":
                retStr = str;
                break;
            default:
                throw new Error("Unknown case style");
        }
        return retStr;
    });
    Handlebars.registerHelper("concat", (stra, strb) => {
        return stra + strb;
    });
    Handlebars.registerHelper("toFileName", str => {
        let retStr = "";
        switch (generationOptions.convertCaseFile) {
            case "camel":
                retStr = changeCase.camelCase(str);
                break;
            case "param":
                retStr = changeCase.paramCase(str);
                break;
            case "pascal":
                retStr = changeCase.pascalCase(str);
                break;
            case "none":
                retStr = str;
                break;
            default:
                throw new Error("Unknown case style");
        }
        return retStr;
    });
    Handlebars.registerHelper("printPropertyVisibility", () =>
        generationOptions.propertyVisibility !== "none"
            ? `${generationOptions.propertyVisibility} `
            : ""
    );
    Handlebars.registerHelper("toPropertyName", str => {
        let retStr = "";
        switch (generationOptions.convertCaseProperty) {
            case "camel":
                retStr = changeCase.camelCase(str);
                break;
            case "pascal":
                retStr = changeCase.pascalCase(str);
                break;
            case "none":
                retStr = str;
                break;
            default:
                throw new Error("Unknown case style");
        }
        return retStr;
    });
    Handlebars.registerHelper("toLowerCase", str => str.toLowerCase());
    Handlebars.registerHelper("tolowerCaseFirst", str =>
        changeCase.lowerCaseFirst(str)
    );
    Handlebars.registerHelper("strictMode", () =>
        generationOptions.strictMode ? generationOptions.strictMode : ""
    );
    Handlebars.registerHelper("toLazy", str => {
        if (generationOptions.lazy) {
            return `Promise<${str}>`;
        }
        return str;
    });
    Handlebars.registerHelper({
        and: (v1, v2) => v1 && v2,
        eq: (v1, v2) => v1 === v2,
        gt: (v1, v2) => v1 > v2,
        gte: (v1, v2) => v1 >= v2,
        lt: (v1, v2) => v1 < v2,
        lte: (v1, v2) => v1 <= v2,
        ne: (v1, v2) => v1 !== v2,
        or: (v1, v2) => v1 || v2
    });
}

// TODO:Move to mustache template file
function createTsConfigFile(resultPath) {
    fs.writeFileSync(
        path.resolve(resultPath, "tsconfig.json"),
        `{"compilerOptions": {
        "lib": ["es5", "es6"],
        "target": "es6",
        "module": "commonjs",
        "moduleResolution": "node",
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "sourceMap": true
    }}`,
        { encoding: "UTF-8", flag: "w" }
    );
}
function createTypeOrmConfig(
    resultPath: string,
    connectionOptions: IConnectionOptions
) {
    if (connectionOptions.schemaName === "") {
        fs.writeFileSync(
            path.resolve(resultPath, "ormconfig.json"),
            `[
  {
    "name": "default",
    "type": "${connectionOptions.databaseType}",
    "host": "${connectionOptions.host}",
    "port": ${connectionOptions.port},
    "username": "${connectionOptions.user}",
    "password": "${connectionOptions.password}",
    "database": "${connectionOptions.databaseName}",
    "synchronize": false,
    "entities": [
      "entities/*.js"
    ]
  }
]`,
            { encoding: "UTF-8", flag: "w" }
        );
    } else {
        fs.writeFileSync(
            path.resolve(resultPath, "ormconfig.json"),
            `[
  {
    "name": "default",
    "type": "${connectionOptions.databaseType}",
    "host": "${connectionOptions.host}",
    "port": ${connectionOptions.port},
    "username": "${connectionOptions.user}",
    "password": "${connectionOptions.password}",
    "database": "${connectionOptions.databaseName}",
    "schema": "${connectionOptions.schemaName}",
    "synchronize": false,
    "entities": [
      "entities/*.js"
    ]
  }
]`,
            { encoding: "UTF-8", flag: "w" }
        );
    }
}
function applyNamingStrategy(
    namingStrategy: AbstractNamingStrategy,
    dbModel: EntityInfo[]
) {
    let retval = changeRelationNames(dbModel);
    retval = changeEntityNames(retval);
    retval = changeColumnNames(retval);
    return retval;

    function changeRelationNames(model: EntityInfo[]) {
        model.forEach(entity => {
            entity.Columns.forEach(column => {
                column.relations.forEach(relation => {
                    const newName = namingStrategy.relationName(
                        column.tsName,
                        relation,
                        model
                    );
                    model.forEach(entity2 => {
                        entity2.Columns.forEach(column2 => {
                            column2.relations.forEach(relation2 => {
                                if (
                                    relation2.relatedTable ===
                                        entity.tsEntityName &&
                                    relation2.ownerColumn === column.tsName
                                ) {
                                    relation2.ownerColumn = newName;
                                }
                                if (
                                    relation2.relatedTable ===
                                        entity.tsEntityName &&
                                    relation2.relatedColumn === column.tsName
                                ) {
                                    relation2.relatedColumn = newName;
                                }
                                if (relation.isOwner) {
                                    entity.Indexes.forEach(ind => {
                                        ind.columns
                                            .filter(
                                                col =>
                                                    col.name === column.tsName
                                            )
                                            .forEach(col => {
                                                col.name = newName;
                                            });
                                    });
                                }
                            });
                        });
                    });
                    column.tsName = newName;
                });
            });
        });
        return dbModel;
    }

    function changeColumnNames(model: EntityInfo[]) {
        model.forEach(entity => {
            entity.Columns.forEach(column => {
                const newName = namingStrategy.columnName(
                    column.tsName,
                    column
                );
                entity.Indexes.forEach(index => {
                    index.columns
                        .filter(column2 => column2.name === column.tsName)
                        .forEach(column2 => {
                            column2.name = newName;
                        });
                });
                model.forEach(entity2 => {
                    entity2.Columns.forEach(column2 => {
                        column2.relations
                            .filter(
                                relation =>
                                    relation.relatedTable ===
                                        entity.tsEntityName &&
                                    relation.relatedColumn === column.tsName
                            )
                            .forEach(v => {
                                v.relatedColumn = newName;
                            });
                        column2.relations
                            .filter(
                                relation =>
                                    relation.relatedTable ===
                                        entity.tsEntityName &&
                                    relation.ownerColumn === column.tsName
                            )
                            .forEach(v => {
                                v.ownerColumn = newName;
                            });
                    });
                });

                column.tsName = newName;
            });
        });
        return model;
    }
    function changeEntityNames(entities: EntityInfo[]) {
        entities.forEach(entity => {
            const newName = namingStrategy.entityName(
                entity.tsEntityName,
                entity
            );
            entities.forEach(entity2 => {
                entity2.Columns.forEach(column => {
                    column.relations.forEach(relation => {
                        if (relation.ownerTable === entity.tsEntityName) {
                            relation.ownerTable = newName;
                        }
                        if (relation.relatedTable === entity.tsEntityName) {
                            relation.relatedTable = newName;
                        }
                    });
                });
            });
            entity.tsEntityName = newName;
        });
        return entities;
    }
}
