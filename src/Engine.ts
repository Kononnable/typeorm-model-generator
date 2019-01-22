import changeCase = require("change-case");
import fs = require("fs");
import * as Handlebars from "handlebars";
import path = require("path");
import { AbstractNamingStrategy } from "./AbstractNamingStrategy";
import { AbstractDriver } from "./drivers/AbstractDriver";
import { MariaDbDriver } from "./drivers/MariaDbDriver";
import { MssqlDriver } from "./drivers/MssqlDriver";
import { MysqlDriver } from "./drivers/MysqlDriver";
import { OracleDriver } from "./drivers/OracleDriver";
import { PostgresDriver } from "./drivers/PostgresDriver";
import { SqliteDriver } from "./drivers/SqliteDriver";
import { EntityInfo } from "./models/EntityInfo";
import { NamingStrategy } from "./NamingStrategy";
import * as TomgUtils from "./Utils";

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
    function setRelationId(model: EntityInfo[]) {
        if (generationOptions.relationIds) {
            model.forEach(ent => {
                ent.Columns.forEach(col => {
                    col.relations.map(rel => {
                        rel.relationIdField = rel.isOwner;
                    });
                });
            });
        }
        return model;
    }

    let dbModel = await driver.GetDataFromServer(connectionOptions);
    if (dbModel.length === 0) {
        TomgUtils.LogError(
            "Tables not found in selected database. Skipping creation of typeorm model.",
            false
        );
        return;
    }
    dbModel = setRelationId(dbModel);
    dbModel = ApplyNamingStrategy(generationOptions.namingStrategy, dbModel);
    createModelFromMetadata(connectionOptions, generationOptions, dbModel);
}
function createModelFromMetadata(
    connectionOptions: IConnectionOptions,
    generationOptions: IGenerationOptions,
    databaseModel: EntityInfo[]
) {
    createHandlebarsHelpers(generationOptions);
    const templatePath = path.resolve(__dirname, "../../src/entity.mst");
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
        element.Imports = [];
        element.Columns.forEach(column => {
            column.relations.forEach(relation => {
                if (element.tsEntityName !== relation.relatedTable) {
                    element.Imports.push(relation.relatedTable);
                }
            });
        });
        element.GenerateConstructor = generationOptions.constructor;
        element.IsActiveRecord = generationOptions.activeRecord;
        element.Imports.filter((elem, index, self) => {
            return index === self.indexOf(elem);
        });
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
        }
        const resultFilePath = path.resolve(entitesPath, casedFileName + ".ts");
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
        }
        return retStr;
    });
    Handlebars.registerHelper("printPropertyVisibility", () =>
        generationOptions.propertyVisibility !== "none"
            ? generationOptions.propertyVisibility + " "
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
        }
        return retStr;
    });
    Handlebars.registerHelper("toLowerCase", str => str.toLowerCase());
    Handlebars.registerHelper("toLazy", str => {
        if (generationOptions.lazy) {
            return `Promise<${str}>`;
        } else {
            return str;
        }
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
function ApplyNamingStrategy(
    namingStrategy: NamingStrategy,
    dbModel: EntityInfo[]
) {
    dbModel = changeRelationNames(dbModel);
    dbModel = changeEntityNames(dbModel);
    dbModel = changeColumnNames(dbModel);
    return dbModel;

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
                                            .forEach(
                                                col => (col.name = newName)
                                            );
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
                const newName = namingStrategy.columnName(column.tsName);
                entity.Indexes.forEach(index => {
                    index.columns
                        .filter(column2 => column2.name === column.tsName)
                        .forEach(column2 => (column2.name = newName));
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
                            .map(v => (v.relatedColumn = newName));
                        column2.relations
                            .filter(
                                relation =>
                                    relation.relatedTable ===
                                        entity.tsEntityName &&
                                    relation.ownerColumn === column.tsName
                            )
                            .map(v => (v.ownerColumn = newName));
                    });
                });

                column.tsName = newName;
            });
        });
        return model;
    }
    function changeEntityNames(entities: EntityInfo[]) {
        entities.forEach(entity => {
            const newName = namingStrategy.entityName(entity.tsEntityName);
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

export interface IConnectionOptions {
    host: string;
    port: number;
    databaseName: string;
    user: string;
    password: string;
    databaseType: string;
    schemaName: string;
    ssl: boolean;
}
export interface IGenerationOptions {
    resultsPath: string;
    noConfigs: boolean;
    convertCaseFile: "pascal" | "param" | "camel" | "none";
    convertCaseEntity: "pascal" | "camel" | "none";
    convertCaseProperty: "pascal" | "camel" | "none";
    propertyVisibility: "public" | "protected" | "private" | "none";
    lazy: boolean;
    activeRecord: boolean;
    constructor: boolean;
    namingStrategy: AbstractNamingStrategy;
    relationIds: boolean;
}
