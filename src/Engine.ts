import * as Handlebars from "handlebars";
import * as Prettier from "prettier";
import { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults";
import * as TomgUtils from "./Utils";
import AbstractDriver from "./drivers/AbstractDriver";
import MssqlDriver from "./drivers/MssqlDriver";
import MariaDbDriver from "./drivers/MariaDbDriver";
import IConnectionOptions from "./IConnectionOptions";
import IGenerationOptions from "./IGenerationOptions";
import PostgresDriver from "./drivers/PostgresDriver";
import MysqlDriver from "./drivers/MysqlDriver";
import OracleDriver from "./drivers/OracleDriver";
import SqliteDriver from "./drivers/SqliteDriver";
import NamingStrategy from "./NamingStrategy";
import AbstractNamingStrategy from "./AbstractNamingStrategy";
import { Entity } from "./models/Entity";
import { Relation } from "./models/Relation";

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
    let dbModel = await dataCollectionPhase(
        driver,
        connectionOptions,
        generationOptions
    );
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
    // const dbModel: Entity = {
    //     sqlName: "sqlName",
    //     tscName: "typescriptName",
    //     schema: "schema",
    //     database: "database",
    //     columns: [
    //         {
    //             tscType: "typescriptType",
    //             tscName: "tscName",
    //             options: {
    //                 name: "sqlName",
    //                 type: "integer",
    //                 length: 2,
    //                 scale: 2
    //             }
    //         },
    //         {
    //             tscType: "typescriptType",
    //             tscName: "tscName",
    //             options: {
    //                 name: "sqlName",
    //                 type: "integer",
    //                 length: 2,
    //                 scale: 2
    //             }
    //         }
    //     ],
    //     indices: [
    //         {
    //             columns: ["columns"],
    //             name: "name"
    //         },
    //         {
    //             columns: ["columns"],
    //             name: "name"
    //         }
    //     ],
    //     relations: [
    //         {
    //             relationType: "OneToMany",
    //             relatedField: "relatedField",
    //             fieldName: "relation",
    //             relatedTable: "any",
    //             relationOptions: {
    //                 onUpdate: "CASCADE",
    //                 onDelete: "NO ACTION"
    //             }
    //         },
    //         {
    //             relationType: "OneToOne",
    //             relatedField: "relatedField",
    //             fieldName: "relation",
    //             relatedTable: "any",
    //             relationOptions: {
    //                 onUpdate: "CASCADE",
    //                 onDelete: "NO ACTION"
    //             }
    //         }
    //     ]
    // };
    modelGenerationPhase(connectionOptions, generationOptions, dbModel);
}
export async function dataCollectionPhase(
    driver: AbstractDriver,
    connectionOptions: IConnectionOptions,
    generationOptions: IGenerationOptions
) {
    return driver.GetDataFromServer(connectionOptions, generationOptions);
}

export function modelCustomizationPhase(
    dbModel: Entity[],
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
    let retVal = applyNamingStrategy(namingStrategy, dbModel);
    retVal = addImportsAndGenerationOptions(retVal, generationOptions);
    retVal = removeColumnDefaultProperties(retVal, defaultValues);
    return retVal;
}
function removeColumnDefaultProperties(
    dbModel: Entity[],
    defaultValues: DataTypeDefaults
) {
    if (!defaultValues) {
        return dbModel;
    }
    dbModel.forEach(entity => {
        entity.columns.forEach(column => {
            const defVal = defaultValues[column.tscType as any];
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
    dbModel: Entity[],
    generationOptions: IGenerationOptions
) {
    dbModel.forEach(entity => {
        entity.relations.forEach(relation => {
            if (generationOptions.lazy) {
                if (!relation.relationOptions) {
                    relation.relationOptions = {};
                }
                relation.relationOptions.lazy = true;
            }
        });
        if (generationOptions.skipSchema) {
            entity.schema = undefined;
            entity.database = undefined;
        }
    });
    return dbModel;
}

export function modelGenerationPhase(
    connectionOptions: IConnectionOptions,
    generationOptions: IGenerationOptions,
    databaseModel: Entity[]
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
                casedFileName = changeCase.camelCase(element.tscName);
                break;
            case "param":
                casedFileName = changeCase.paramCase(element.tscName);
                break;
            case "pascal":
                casedFileName = changeCase.pascalCase(element.tscName);
                break;
            case "none":
                casedFileName = element.tscName;
                break;
            default:
                throw new Error("Unknown case style");
        }
        const resultFilePath = path.resolve(entitesPath, `${casedFileName}.ts`);
        const rendered = compliedTemplate(element);
        const formatted = Prettier.format(rendered, { parser: "typescript" });
        fs.writeFileSync(resultFilePath, formatted, {
            encoding: "UTF-8",
            flag: "w"
        });
    });
}

function createHandlebarsHelpers(generationOptions: IGenerationOptions) {
    Handlebars.registerHelper("json", context => {
        const json = JSON.stringify(context);
        const withoutQuotes = json.replace(/"([^(")"]+)":/g, "$1:");
        return withoutQuotes.slice(1, withoutQuotes.length - 1);
    });
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
    Handlebars.registerHelper("concat", (stra: string, strb: string) => {
        return stra + strb;
    });
    Handlebars.registerHelper("contains", function contains(
        searchTerm: string,
        target: string,
        options
    ) {
        return target.indexOf(searchTerm) > -1
            ? options.fn(this)
            : options.inverse(this);
    });
    Handlebars.registerHelper("toFileImports", (set: Set<any>) => {
        return [...set].reduce(
            (pv, cv) =>
                `${pv}import { {{toEntityName ${cv}}} } from './{{toFileName ${cv}}};`,
            ""
        );
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
    Handlebars.registerHelper(
        "toRelation",
        (entityType: string, relationType: Relation["relationType"]) => {
            let retVal = entityType;
            if (relationType === "ManyToMany" || relationType === "OneToMany") {
                retVal = `${retVal}[]`;
            }
            if (generationOptions.lazy) {
                retVal = `Promise<${retVal}>`;
            }
            return retVal;
        }
    );
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
    dbModel: Entity[]
) {
    let retval = changeRelationNames(dbModel);
    retval = changeRelationIdNames(retval);
    retval = changeEntityNames(retval);
    retval = changeColumnNames(retval);
    return retval;

    function changeRelationIdNames(model: Entity[]) {
        model.forEach(entity => {
            entity.relationIds.forEach(relationId => {
                const oldName = relationId.fieldName;
                const relation = entity.relations.find(
                    v => v.fieldName === relationId.relationField
                )!;
                let newName = namingStrategy.relationIdName(
                    relationId,
                    relation,
                    entity
                );
                newName = TomgUtils.findNameForNewField(
                    newName,
                    entity,
                    oldName
                );
                entity.indices.forEach(index => {
                    index.columns = index.columns.map(column2 =>
                        column2 === oldName ? newName : column2
                    );
                });

                relationId.fieldName = newName;
            });
        });
        return dbModel;
    }

    function changeRelationNames(model: Entity[]) {
        model.forEach(entity => {
            entity.relations.forEach(relation => {
                const oldName = relation.fieldName;
                let newName = namingStrategy.relationName(relation, entity);
                newName = TomgUtils.findNameForNewField(
                    newName,
                    entity,
                    oldName
                );

                const relatedEntity = model.find(
                    v => v.tscName === relation.relatedTable
                )!;
                const relation2 = relatedEntity.relations.find(
                    v => v.fieldName === relation.relatedField
                )!;

                entity.relationIds
                    .filter(v => v.relationField === oldName)
                    .forEach(v => {
                        v.relationField = newName;
                    });

                relation.fieldName = newName;
                relation2.relatedField = newName;

                if (relation.relationOptions) {
                    entity.indices.forEach(ind => {
                        ind.columns.map(column2 =>
                            column2 === oldName ? newName : column2
                        );
                    });
                }
            });
        });
        return dbModel;
    }

    function changeColumnNames(model: Entity[]) {
        model.forEach(entity => {
            entity.columns.forEach(column => {
                const oldName = column.tscName;
                let newName = namingStrategy.columnName(column.tscName, column);
                newName = TomgUtils.findNameForNewField(
                    newName,
                    entity,
                    oldName
                );
                entity.indices.forEach(index => {
                    index.columns = index.columns.map(column2 =>
                        column2 === oldName ? newName : column2
                    );
                });

                column.tscName = newName;
            });
        });
        return model;
    }
    function changeEntityNames(entities: Entity[]) {
        entities.forEach(entity => {
            const newName = namingStrategy.entityName(entity.tscName, entity);
            entities.forEach(entity2 => {
                entity2.relations.forEach(relation => {
                    if (relation.relatedTable === entity.tscName) {
                        relation.relatedTable = newName;
                    }
                });
            });
            entity.tscName = newName;
        });
        return entities;
    }
}
