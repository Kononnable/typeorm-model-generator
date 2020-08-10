import * as Yargs from "yargs";
import { createDriver, createModelFromDatabase } from "./Engine";
import * as TomgUtils from "./Utils";
import IConnectionOptions, {
    getDefaultConnectionOptions,
} from "./IConnectionOptions";
import IGenerationOptions, {
    getDefaultGenerationOptions,
} from "./IGenerationOptions";

import fs = require("fs-extra");
import inquirer = require("inquirer");
import path = require("path");

// eslint-disable-next-line @typescript-eslint/no-floating-promises
CliLogic();

type options = {
    connectionOptions: IConnectionOptions;
    generationOptions: IGenerationOptions;
};

async function CliLogic() {
    console.log(TomgUtils.packageVersion());
    let options = makeDefaultConfigs();
    const TOMLConfig = readTOMLConfig(options);
    options = TOMLConfig.options;
    if (process.argv.length > 2) {
        options = checkYargsParameters(options);
    } else if (!TOMLConfig.fullConfigFile) {
        options = await useInquirer(options);
    }
    options = validateConfig(options);
    const driver = createDriver(options.connectionOptions.databaseType);
    console.log(
        `[${new Date().toLocaleTimeString()}] Starting creation of model classes.`
    );
    await createModelFromDatabase(
        driver,
        options.connectionOptions,
        options.generationOptions
    );
    console.info(
        `[${new Date().toLocaleTimeString()}] Typeorm model classes created.`
    );
}
function validateConfig(options: options): options {
    if (
        options.generationOptions.lazy &&
        options.generationOptions.relationIds
    ) {
        TomgUtils.LogError(
            "Typeorm doesn't support RelationId fields for lazy relations.",
            false
        );
        options.generationOptions.relationIds = false;
    } else if (
        options.generationOptions.activeRecord &&
        options.generationOptions.extendAbstractClass
    ) {
        TomgUtils.LogError(
            "Typeorm cannot use ActiveRecord and extend-abstract-class at the same time.",
            false
        );
        options.generationOptions.activeRecord = false;
    }
    return options;
}
function makeDefaultConfigs() {
    const generationOptions = getDefaultGenerationOptions();
    const connectionOptions = getDefaultConnectionOptions();
    return {
        generationOptions,
        connectionOptions,
    };
}
function readTOMLConfig(
    options: options
): { options; fullConfigFile: boolean } {
    if (!fs.existsSync(path.resolve(process.cwd(), ".tomg-config"))) {
        return { options, fullConfigFile: false };
    }
    console.log(
        `[${new Date().toLocaleTimeString()}] Using configuration file. [${path.resolve(
            process.cwd(),
            ".tomg-config"
        )}]`
    );
    const retVal = fs.readJsonSync(path.resolve(process.cwd(), ".tomg-config"));
    const [loadedGenerationOptions, loadedConnectionOptions] = retVal;

    let hasUnknownProperties = false;
    if (loadedConnectionOptions) {
        Object.keys(loadedConnectionOptions).forEach((key) => {
            if (
                Object.prototype.hasOwnProperty.call(
                    options.connectionOptions,
                    key
                )
            ) {
                options.connectionOptions[key] = loadedConnectionOptions[key];
            } else {
                console.error(`Unknown connection option ${key}.`);
                hasUnknownProperties = true;
            }
        });
    }
    if (loadedGenerationOptions) {
        Object.keys(loadedGenerationOptions).forEach((key) => {
            if (
                Object.prototype.hasOwnProperty.call(
                    options.generationOptions,
                    key
                )
            ) {
                options.generationOptions[key] = loadedGenerationOptions[key];
            } else {
                console.error(`Unknown generation option ${key}.`);
                hasUnknownProperties = true;
            }
        });
    }

    const fullConfigFile =
        !hasUnknownProperties &&
        loadedConnectionOptions &&
        loadedGenerationOptions &&
        Object.keys(loadedConnectionOptions).length ===
            Object.keys(options.connectionOptions).length &&
        Object.keys(loadedGenerationOptions).length ===
            Object.keys(options.generationOptions).length;

    return {
        options,
        fullConfigFile,
    };
}
function checkYargsParameters(options: options): options {
    const { argv } = Yargs.usage(
        "Usage: typeorm-model-generator -h <host> -d <database> -p [port] -u <user> -x [password] -e [engine]\nYou can also run program without specifying any parameters."
    ).options({
        h: {
            alias: "host",
            string: true,
            default: options.connectionOptions.host,
            describe: "IP address/Hostname for database server",
        },
        d: {
            alias: "database",
            string: true,
            demand: true,
            default: options.connectionOptions.databaseName,
            describe:
                "Database name(or path for sqlite). You can pass multiple values separated by comma.",
        },
        u: {
            alias: "user",
            string: true,
            default: options.connectionOptions.user,
            describe: "Username for database server",
        },
        x: {
            alias: "pass",
            string: true,
            default: options.connectionOptions.password,
            describe: "Password for database server",
        },
        p: {
            number: true,
            alias: "port",
            default: options.connectionOptions.port,
            describe: "Port number for database server",
        },
        e: {
            alias: "engine",
            choices: [
                "mssql",
                "postgres",
                "mysql",
                "mariadb",
                "oracle",
                "sqlite",
            ],
            demand: true,
            default: options.connectionOptions.databaseType,
            describe: "Database engine",
        },
        o: {
            alias: "output",
            default: options.generationOptions.resultsPath,
            describe: "Where to place generated models",
        },
        s: {
            alias: "schema",
            string: true,
            default: options.connectionOptions.schemaName,
            describe:
                "Schema name to create model from. Only for mssql and postgres. You can pass multiple values separated by comma eg. -s scheme1,scheme2,scheme3",
        },
        ssl: {
            boolean: true,
            default: options.connectionOptions.ssl,
        },
        noConfig: {
            boolean: true,
            default: options.generationOptions.noConfigs,
            describe: `Doesn't create tsconfig.json and ormconfig.json`,
        },
        cf: {
            alias: "case-file",
            choices: ["pascal", "param", "camel", "none"],
            default: options.generationOptions.convertCaseFile,
            describe: "Convert file names to specified case",
        },
        ce: {
            alias: "case-entity",
            choices: ["pascal", "camel", "none"],
            default: options.generationOptions.convertCaseEntity,
            describe: "Convert class names to specified case",
        },
        cp: {
            alias: "case-property",
            choices: ["pascal", "camel", "none"],
            default: options.generationOptions.convertCaseProperty,
            describe: "Convert property names to specified case",
        },
        eol: {
            choices: ["LF", "CRLF"],
            default: options.generationOptions.convertEol,
            describe: "Force EOL to be LF or CRLF",
        },
        pv: {
            alias: "property-visibility",
            choices: ["public", "protected", "private", "none"],
            default: options.generationOptions.propertyVisibility,
            describe:
                "Defines which visibility should have the generated property",
        },
        lazy: {
            boolean: true,
            default: options.generationOptions.lazy,
            describe: "Generate lazy relations",
        },
        a: {
            alias: "active-record",
            boolean: true,
            default: options.generationOptions.activeRecord,
            describe: "Use ActiveRecord syntax for generated models",
        },
        skipRelationships: {
            alias: "skip-relationships",
            boolean: true,
            default: options.generationOptions.skipRelationships,
            describe: "Skip relationship declarations",
        },
        extendAbstractClass: {
            alias: "extend-abstract-class",
            string: true,
            default: options.generationOptions.extendAbstractClass,
            describe: "Make generated models extend a custom abstract class",
        },
        exportAbstractClass: {
            alias: "export-abstract-class",
            boolean: true,
            default: options.generationOptions.exportAbstractClass,
            describe: "Export generated models as abstract classes",
        },
        namingStrategy: {
            describe: "Use custom naming strategy",
            default: options.generationOptions.customNamingStrategyPath,
            string: true,
        },
        relationIds: {
            boolean: true,
            default: options.generationOptions.relationIds,
            describe: "Generate RelationId fields",
        },
        skipSchema: {
            boolean: true,
            default: options.generationOptions.skipSchema,
            describe: "Omits schema identifier in generated entities",
        },
        generateConstructor: {
            boolean: true,
            default: options.generationOptions.generateConstructor,
            describe: "Generate constructor allowing partial initialization",
        },
        disablePluralization: {
            boolean: true,
            default: !options.generationOptions.pluralizeNames,
            describe:
                "Disable pluralization of OneToMany, ManyToMany relation names",
        },
        skipTables: {
            string: true,
            default: options.connectionOptions.skipTables.join(","),
            describe:
                "Skip schema generation for specific tables. You can pass multiple values separated by comma",
        },
        strictMode: {
            choices: ["none", "?", "!"],
            default: options.generationOptions.strictMode,
            describe: "Mark fields as optional(?) or non-null(!)",
        },
        index: {
            boolean: true,
            default: options.generationOptions.indexFile,
            describe: "Generate index file",
        },
        defaultExport: {
            boolean: true,
            default: options.generationOptions.exportType === "default",
            describe: "Generate index file",
        },
    });

    options.connectionOptions.databaseName = argv.d;
    options.connectionOptions.databaseType = argv.e;

    const driver = createDriver(options.connectionOptions.databaseType);
    const { standardPort, standardSchema, standardUser } = driver;

    options.connectionOptions.host = argv.h;
    options.connectionOptions.password = argv.x;
    options.connectionOptions.port = argv.p || standardPort;
    options.connectionOptions.schemaName = argv.s
        ? argv.s.toString()
        : standardSchema;
    options.connectionOptions.ssl = argv.ssl;
    options.connectionOptions.user = argv.u || standardUser;
    let skipTables = argv.skipTables.split(",");
    if (skipTables.length === 1 && skipTables[0] === "") {
        skipTables = []; // #252
    }
    options.connectionOptions.skipTables = skipTables;
    options.generationOptions.activeRecord = argv.a;
    options.generationOptions.skipRelationships = argv.skipRelationships;
    options.generationOptions.extendAbstractClass = argv.extendAbstractClass;
    options.generationOptions.generateConstructor = argv.generateConstructor;
    options.generationOptions.convertCaseEntity = argv.ce as IGenerationOptions["convertCaseEntity"];
    options.generationOptions.convertCaseFile = argv.cf as IGenerationOptions["convertCaseFile"];
    options.generationOptions.convertCaseProperty = argv.cp as IGenerationOptions["convertCaseProperty"];
    options.generationOptions.convertEol = argv.eol as IGenerationOptions["convertEol"];
    options.generationOptions.lazy = argv.lazy;
    options.generationOptions.customNamingStrategyPath = argv.namingStrategy;
    options.generationOptions.noConfigs = argv.noConfig;
    options.generationOptions.propertyVisibility = argv.pv as IGenerationOptions["propertyVisibility"];
    options.generationOptions.relationIds = argv.relationIds;
    options.generationOptions.skipSchema = argv.skipSchema;
    options.generationOptions.resultsPath = argv.o;
    options.generationOptions.pluralizeNames = !argv.disablePluralization;
    options.generationOptions.strictMode = argv.strictMode as IGenerationOptions["strictMode"];
    options.generationOptions.indexFile = argv.index;
    options.generationOptions.exportType = argv.defaultExport
        ? "default"
        : "named";
    options.generationOptions.exportAbstractClass = argv.exportAbstractClass;
    return options;
}

async function useInquirer(options: options): Promise<options> {
    const oldDatabaseType = options.connectionOptions.databaseType;
    options.connectionOptions.databaseType = (
        await inquirer.prompt([
            {
                choices: [
                    "mssql",
                    "postgres",
                    "mysql",
                    "mariadb",
                    "oracle",
                    "sqlite",
                ],
                default: options.connectionOptions.databaseType,
                message: "Choose database engine",
                name: "engine",
                type: "list",
            },
        ])
    ).engine;
    const driver = createDriver(options.connectionOptions.databaseType);
    if (options.connectionOptions.databaseType !== oldDatabaseType) {
        options.connectionOptions.port = driver.standardPort;
        options.connectionOptions.user = driver.standardUser;
        options.connectionOptions.schemaName = driver.standardSchema;
    }
    if (options.connectionOptions.databaseType !== "sqlite") {
        const answ = await inquirer.prompt([
            {
                default: options.connectionOptions.host,
                message: "Database address:",
                name: "host",
                type: "input",
            },
            {
                message: "Database port:",
                name: "port",
                type: "input",
                default: options.connectionOptions.port,
                validate(value) {
                    const valid = !Number.isNaN(parseInt(value, 10));
                    return valid || "Please enter a valid port number";
                },
            },
            {
                default: options.connectionOptions.ssl,
                message: "Use SSL:",
                name: "ssl",
                type: "confirm",
            },
            {
                message: "Database user name:",
                name: "login",
                type: "input",
                default: options.connectionOptions.user,
            },
            {
                message: "Database user password:",
                name: "password",
                type: "password",
            },
            {
                default: options.connectionOptions.databaseName,
                message:
                    "Database name: (You can pass multiple values separated by comma)",
                name: "dbName",
                type: "input",
            },
        ]);
        if (
            options.connectionOptions.databaseType === "mssql" ||
            options.connectionOptions.databaseType === "postgres"
        ) {
            options.connectionOptions.schemaName = (
                await inquirer.prompt([
                    {
                        default: options.connectionOptions.schemaName,
                        message:
                            "Database schema: (You can pass multiple values separated by comma)",
                        name: "schema",
                        type: "input",
                    },
                ])
            ).schema;
        }
        options.connectionOptions.port = parseInt(answ.port, 10);
        options.connectionOptions.host = answ.host;
        options.connectionOptions.user = answ.login;
        options.connectionOptions.password = answ.password;
        options.connectionOptions.databaseName = answ.dbName;
        options.connectionOptions.ssl = answ.ssl;
    } else {
        options.connectionOptions.databaseName = (
            await inquirer.prompt([
                {
                    default: options.connectionOptions.databaseName,
                    message: "Path to database file:",
                    name: "dbName",
                    type: "input",
                },
            ])
        ).dbName;
    }

    const ignoreSpecyficTables = (
        await inquirer.prompt([
            {
                default:
                    options.connectionOptions.skipTables.length === 0
                        ? "All of them"
                        : "Ignore specific tables",
                message: "Generate schema for tables:",
                choices: ["All of them", "Ignore specific tables"],
                name: "specyficTables",
                type: "list",
            },
        ])
    ).specyficTables;
    if (ignoreSpecyficTables === "Ignore specific tables") {
        const { tableNames } = await inquirer.prompt({
            default: options.connectionOptions.skipTables.join(","),
            message: "Table names(separated by comma)",
            name: "tableNames",
            type: "input",
        });
        options.connectionOptions.skipTables = tableNames.split(",");
    } else {
        options.connectionOptions.skipTables = [];
    }

    options.generationOptions.resultsPath = (
        await inquirer.prompt([
            {
                default: options.generationOptions.resultsPath,
                message: "Path where generated models should be stored:",
                name: "output",
                type: "input",
            },
        ])
    ).output;
    const { customizeGeneration } = await inquirer.prompt([
        {
            default: false,
            message: "Do you want to customize generated model?",
            name: "customizeGeneration",
            type: "confirm",
        },
    ]);
    if (customizeGeneration) {
        const defaultGenerationOptions = getDefaultGenerationOptions();
        const customizations: string[] = (
            await inquirer.prompt([
                {
                    choices: [
                        {
                            checked: !options.generationOptions.noConfigs,
                            name: "Generate config files",
                            value: "config",
                        },
                        {
                            name: "Generate lazy relations",
                            value: "lazy",
                            checked: options.generationOptions.lazy,
                        },
                        {
                            name:
                                "Use ActiveRecord syntax for generated models",
                            value: "activeRecord",
                            checked: options.generationOptions.activeRecord,
                        },
                        {
                            name: "Skip relationship declarations",
                            value: "skipRelationships",
                            checked:
                                options.generationOptions.skipRelationships,
                        },
                        {
                            name:
                                "Generated models extend a custom abstract class",
                            value: "extendAbstractClass",
                            checked:
                                options.generationOptions.extendAbstractClass,
                        },
                        {
                            name: "Use custom naming strategy",
                            value: "namingStrategy",
                            checked: !!options.generationOptions
                                .customNamingStrategyPath,
                        },
                        {
                            name: "Generate RelationId fields",
                            value: "relationId",
                            checked: options.generationOptions.relationIds,
                        },
                        {
                            name:
                                "Omits schema identifier in generated entities",
                            value: "skipSchema",
                            checked: options.generationOptions.skipSchema,
                        },
                        {
                            name:
                                "Generate constructor allowing partial initialization",
                            value: "constructor",
                            checked:
                                options.generationOptions.generateConstructor,
                        },
                        {
                            name: "Use specific naming convention",
                            value: "namingConvention",
                            checked:
                                options.generationOptions.convertCaseEntity !==
                                    defaultGenerationOptions.convertCaseEntity ||
                                options.generationOptions
                                    .convertCaseProperty !==
                                    defaultGenerationOptions.convertCaseProperty ||
                                options.generationOptions.convertCaseFile !==
                                    defaultGenerationOptions.convertCaseFile,
                        },
                        {
                            name: "Use specific EOL character",
                            value: "converteol",
                            checked: false,
                        },
                        {
                            name:
                                "Pluralize OneToMany, ManyToMany relation names",
                            value: "pluralize",
                            checked: options.generationOptions.pluralizeNames,
                        },
                        {
                            name: "Generate index file",
                            value: "index",
                            checked: options.generationOptions.indexFile,
                        },
                        {
                            name: "Prefer default exports",
                            value: "defaultExport",
                            checked:
                                options.generationOptions.exportType ===
                                "default",
                        },
                        {
                            name: "Export generated models as abstract classes",
                            value: "exportAbstractClass",
                            checked:
                                options.generationOptions.exportAbstractClass,
                        },
                    ],
                    message: "Available customizations",
                    name: "selected",
                    type: "checkbox",
                },
            ])
        ).selected;

        options.generationOptions.propertyVisibility = (
            await inquirer.prompt([
                {
                    choices: ["public", "protected", "private", "none"],
                    message:
                        "Defines which visibility should have the generated property",
                    name: "propertyVisibility",
                    default: options.generationOptions.propertyVisibility,
                    type: "list",
                },
            ])
        ).propertyVisibility;

        options.generationOptions.strictMode = (
            await inquirer.prompt([
                {
                    choices: ["none", "?", "!"],
                    message: "Mark fields as optional(?) or non-null(!)",
                    name: "strictMode",
                    default: options.generationOptions.strictMode,
                    type: "list",
                },
            ])
        ).strictMode;

        options.generationOptions.noConfigs = !customizations.includes(
            "config"
        );
        options.generationOptions.pluralizeNames = customizations.includes(
            "pluralize"
        );
        options.generationOptions.lazy = customizations.includes("lazy");
        options.generationOptions.activeRecord = customizations.includes(
            "activeRecord"
        );
        options.generationOptions.skipRelationships = customizations.includes(
            "skipRelationships"
        );
        if (customizations.includes("extendAbstractClass")) {
            const { extendAbstractClass } = await inquirer.prompt([
                {
                    default: options.generationOptions.extendAbstractClass,
                    message: "Relative path to custom abstract class file:",
                    name: "extendAbstractClass",
                    type: "input",
                    validate(value) {
                        const valid = value === "" || fs.existsSync(value);
                        return (
                            valid ||
                            "Please enter a valid relative path to custom abstract class file"
                        );
                    },
                },
            ]);

            if (extendAbstractClass && extendAbstractClass !== "") {
                const resultsAbsolutePath = path.join(
                    process.cwd(),
                    options.generationOptions.resultsPath
                );
                const abstractClassAbsolutePath = path.join(
                    process.cwd(),
                    options.generationOptions.resultsPath
                );
                const relativePath = path.relative(
                    abstractClassAbsolutePath,
                    resultsAbsolutePath
                );
                options.generationOptions.extendAbstractClass = relativePath;
            } else {
                options.generationOptions.extendAbstractClass = "";
            }
        }
        options.generationOptions.relationIds = customizations.includes(
            "relationId"
        );
        options.generationOptions.skipSchema = customizations.includes(
            "skipSchema"
        );
        options.generationOptions.generateConstructor = customizations.includes(
            "constructor"
        );
        options.generationOptions.indexFile = customizations.includes("index");
        options.generationOptions.exportType = customizations.includes(
            "defaultExport"
        )
            ? "default"
            : "named";
        options.generationOptions.exportAbstractClass = customizations.includes(
            "exportAbstractClass"
        );

        if (customizations.includes("namingStrategy")) {
            const namingStrategyPath = (
                await inquirer.prompt([
                    {
                        default:
                            options.generationOptions.customNamingStrategyPath,
                        message: "Path to custom naming strategy file:",
                        name: "namingStrategy",
                        type: "input",
                        validate(value) {
                            const valid = value === "" || fs.existsSync(value);
                            return (
                                valid ||
                                "Please enter a a valid path to custom naming strategy file"
                            );
                        },
                    },
                ])
            ).namingStrategy;

            if (namingStrategyPath && namingStrategyPath !== "") {
                options.generationOptions.customNamingStrategyPath = namingStrategyPath;
            } else {
                options.generationOptions.customNamingStrategyPath = "";
            }
        }
        if (customizations.includes("namingConvention")) {
            const namingConventions = await inquirer.prompt([
                {
                    choices: ["pascal", "param", "camel", "none"],
                    default: options.generationOptions.convertCaseFile,
                    message: "Convert file names to specified case:",
                    name: "fileCase",
                    type: "list",
                },
                {
                    choices: ["pascal", "camel", "none"],
                    default: options.generationOptions.convertCaseEntity,
                    message: "Convert class names to specified case:",
                    name: "entityCase",
                    type: "list",
                },
                {
                    choices: ["pascal", "camel", "none"],
                    default: options.generationOptions.convertCaseProperty,
                    message: "Convert property names to specified case:",
                    name: "propertyCase",
                    type: "list",
                },
            ]);
            options.generationOptions.convertCaseFile =
                namingConventions.fileCase;
            options.generationOptions.convertCaseProperty =
                namingConventions.propertyCase;
            options.generationOptions.convertCaseEntity =
                namingConventions.entityCase;
        }
        if (customizations.includes("converteol")) {
            const eolChoice = await inquirer.prompt([
                {
                    choices: ["LF", "CRLF"],
                    default: options.generationOptions.convertEol,
                    message: "Force EOL to be:",
                    name: "eol",
                    type: "list",
                },
            ]);
            options.generationOptions.convertEol = eolChoice.eol;
        }
    }
    const { saveConfig } = await inquirer.prompt([
        {
            choices: [
                "Yes, only model customization options",
                "Yes, with connection details",
                "No",
            ],
            default: "No",
            message: "Save configuration to config file?",
            name: "saveConfig",
            type: "list",
        },
    ]);
    if (saveConfig === "Yes, with connection details") {
        await fs.writeJson(
            path.resolve(process.cwd(), ".tomg-config"),
            [options.generationOptions, options.connectionOptions],
            { spaces: 2 }
        );
        console.log(`[${new Date().toLocaleTimeString()}] Config file saved.`);
        console.warn(
            `\x1b[33m[${new Date().toLocaleTimeString()}] WARNING: Password was saved as plain text.\x1b[0m`
        );
    } else if (saveConfig === "Yes, only model customization options") {
        await fs.writeJson(
            path.resolve(process.cwd(), ".tomg-config"),
            [options.generationOptions],
            { spaces: 2 }
        );
        console.log(`[${new Date().toLocaleTimeString()}] Config file saved.`);
    }
    return options;
}
