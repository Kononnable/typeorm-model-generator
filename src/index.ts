import fs = require("fs-extra");
import inquirer = require("inquirer");
import path = require("path");
import * as Yargs from "yargs";
import { AbstractNamingStrategy } from "./AbstractNamingStrategy";
import { AbstractDriver } from "./drivers/AbstractDriver";
import { createDriver, createModelFromDatabase } from "./Engine";
import { IConnectionOptions } from "./IConnectionOptions";
import { IGenerationOptions } from "./IGenerationOptions";
import { NamingStrategy } from "./NamingStrategy";
import * as TomgUtils from "./Utils";

CliLogic();

async function CliLogic() {
    let driver: AbstractDriver;
    let connectionOptions: IConnectionOptions;
    let generationOptions: IGenerationOptions;
    if (process.argv.length > 2) {
        const retval = GetUtilParametersByArgs();
        driver = retval.driver;
        connectionOptions = retval.connectionOptions;
        generationOptions = retval.generationOptions;
    } else {
        const retval = await GetUtilParametersByInquirer();
        driver = retval.driver;
        connectionOptions = retval.connectionOptions;
        generationOptions = retval.generationOptions;
    }
    console.log(TomgUtils.packageVersion());
    console.log(
        `[${new Date().toLocaleTimeString()}] Starting creation of model classes.`
    );
    createModelFromDatabase(driver, connectionOptions, generationOptions).then(
        () => {
            console.info(
                `[${new Date().toLocaleTimeString()}] Typeorm model classes created.`
            );
        }
    );
}

function GetUtilParametersByArgs() {
    const argv = Yargs.usage(
        "Usage: typeorm-model-generator -h <host> -d <database> -p [port] -u <user> -x [password] -e [engine]\nYou can also run program without specyfiying any parameters."
    )
        .option("h", {
            alias: "host",
            default: "127.0.0.1",
            describe: "IP adress/Hostname for database server"
        })
        .option("d", {
            alias: "database",
            demand: true,
            describe: "Database name(or path for sqlite)"
        })
        .option("u", {
            alias: "user",
            describe: "Username for database server"
        })
        .option("x", {
            alias: "pass",
            default: "",
            describe: "Password for database server"
        })
        .option("p", {
            alias: "port",
            describe: "Port number for database server"
        })
        .option("e", {
            alias: "engine",
            choices: [
                "mssql",
                "postgres",
                "mysql",
                "mariadb",
                "oracle",
                "sqlite"
            ],
            default: "mssql",
            describe: "Database engine"
        })
        .option("o", {
            alias: "output",
            default: path.resolve(process.cwd(), "output"),
            describe: "Where to place generated models"
        })
        .option("s", {
            alias: "schema",
            describe:
                "Schema name to create model from. Only for mssql and postgres"
        })
        .option("ssl", {
            boolean: true,
            default: false
        })
        .option("noConfig", {
            boolean: true,
            default: false,
            describe: `Doesn't create tsconfig.json and ormconfig.json`
        })
        .option("cf", {
            alias: "case-file",
            choices: ["pascal", "param", "camel", "none"],
            default: "none",
            describe: "Convert file names to specified case"
        })
        .option("ce", {
            alias: "case-entity",
            choices: ["pascal", "camel", "none"],
            default: "none",
            describe: "Convert class names to specified case"
        })
        .option("cp", {
            alias: "case-property",
            choices: ["pascal", "camel", "none"],
            default: "none",
            describe: "Convert property names to specified case"
        })
        .option("pv", {
            alias: "property-visibility",
            choices: ["public", "protected", "private", "none"],
            default: "none",
            describe:
                "Defines which visibility should have the generated property"
        })
        .option("lazy", {
            boolean: true,
            default: false,
            describe: "Generate lazy relations"
        })
        .option("a", {
            alias: "active-record",
            boolean: true,
            default: false,
            describe: "Use ActiveRecord syntax for generated models"
        })
        .option("namingStrategy", {
            describe: "Use custom naming strategy"
        })
        .option("relationIds", {
            boolean: true,
            default: false,
            describe: "Generate RelationId fields"
        })
        .option("generateConstructor", {
            boolean: true,
            default: false,
            describe: "Generate constructor allowing partial initialization"
        }).argv;

    const driver = createDriver(argv.e);
    const standardPort = driver.standardPort;
    const standardSchema = driver.standardSchema;
    const standardUser = driver.standardPort;
    let namingStrategy: AbstractNamingStrategy;
    if (argv.namingStrategy && argv.namingStrategy !== "") {
        // tslint:disable-next-line:no-var-requires
        const req = require(argv.namingStrategy);
        namingStrategy = new req.NamingStrategy();
    } else {
        namingStrategy = new NamingStrategy();
    }
    const connectionOptions: IConnectionOptions = new IConnectionOptions();
    (connectionOptions.databaseName = argv.d ? argv.d.toString() : null),
        (connectionOptions.databaseType = argv.e),
        (connectionOptions.host = argv.h),
        (connectionOptions.password = argv.x ? argv.x.toString() : null),
        (connectionOptions.port = parseInt(argv.p, 10) || standardPort),
        (connectionOptions.schemaName = argv.s
            ? argv.s.toString()
            : standardSchema),
        (connectionOptions.ssl = argv.ssl),
        (connectionOptions.user = argv.u ? argv.u.toString() : standardUser);
    const generationOptions: IGenerationOptions = new IGenerationOptions();
    (generationOptions.activeRecord = argv.a),
        (generationOptions.generateConstructor = argv.generateConstructor),
        (generationOptions.convertCaseEntity = argv.ce),
        (generationOptions.convertCaseFile = argv.cf),
        (generationOptions.convertCaseProperty = argv.cp),
        (generationOptions.lazy = argv.lazy),
        (generationOptions.namingStrategy = namingStrategy),
        (generationOptions.noConfigs = argv.noConfig),
        (generationOptions.propertyVisibility = argv.pv),
        (generationOptions.relationIds = argv.relationIds),
        (generationOptions.resultsPath = argv.o ? argv.o.toString() : null);

    return { driver, connectionOptions, generationOptions };
}

async function GetUtilParametersByInquirer() {
    const connectionOptions: IConnectionOptions = new IConnectionOptions();
    const generationOptions: IGenerationOptions = new IGenerationOptions();

    connectionOptions.databaseType = ((await inquirer.prompt([
        {
            choices: [
                "mssql",
                "postgres",
                "mysql",
                "mariadb",
                "oracle",
                "sqlite"
            ],
            message: "Choose database engine",
            name: "engine",
            type: "list"
        }
    ])) as any).engine;
    const driver = createDriver(connectionOptions.databaseType);
    if (connectionOptions.databaseType !== "sqlite") {
        const answ: any = await inquirer.prompt([
            {
                default: "localhost",
                message: "Database adress:",
                name: "host",
                type: "input"
            },
            {
                message: "Database port:",
                name: "port",
                type: "input",
                default(answers: any) {
                    return driver.standardPort;
                },
                validate(value) {
                    const valid = !isNaN(parseInt(value, 10));
                    return valid || "Please enter a valid port number";
                }
            },
            {
                default: false,
                message: "Use SSL:",
                name: "ssl",
                type: "confirm"
            },
            {
                message: "Database user name:",
                name: "login",
                type: "input",
                default(answers: any) {
                    return driver.standardUser;
                }
            },
            {
                message: "Database user pasword:",
                name: "password",
                type: "password"
            },
            {
                default: "",
                message: "Database name:",
                name: "dbName",
                type: "input"
            }
        ]);
        if (
            connectionOptions.databaseType === "mssql" ||
            connectionOptions.databaseType === "postgres"
        ) {
            connectionOptions.schemaName = ((await inquirer.prompt([
                {
                    default: driver.standardSchema,
                    message: "Database schema:",
                    name: "schema",
                    type: "input"
                }
            ])) as any).schema;
        }
        connectionOptions.port = answ.port;
        connectionOptions.host = answ.host;
        connectionOptions.user = answ.login;
        connectionOptions.password = answ.password;
        connectionOptions.databaseName = answ.dbName;
        connectionOptions.ssl = answ.ssl;
    } else {
        connectionOptions.databaseName = ((await inquirer.prompt([
            {
                default: "",
                message: "Path to database file:",
                name: "dbName",
                type: "input"
            }
        ])) as any).dbName;
    }
    generationOptions.resultsPath = ((await inquirer.prompt([
        {
            default: path.resolve(process.cwd(), "output"),
            message: "Path where generated models should be stored:",
            name: "output",
            type: "input"
        }
    ])) as any).output;
    const customize = ((await inquirer.prompt([
        {
            default: false,
            message: "Do you want to customize generated model?",
            name: "customize",
            type: "confirm"
        }
    ])) as any).customize;
    if (customize) {
        const customizations: string[] = ((await inquirer.prompt([
            {
                choices: [
                    {
                        checked: true,
                        name: "Generate config files",
                        value: "config"
                    },
                    {
                        name: "Generate lazy relations",
                        value: "lazy"
                    },
                    {
                        name: "Use ActiveRecord syntax for generated models",
                        value: "activeRecord"
                    },
                    {
                        name: "Use custom naming strategy",
                        value: "namingStrategy"
                    },
                    {
                        name: "Generate RelationId fields",
                        value: "relationId"
                    },
                    {
                        name:
                            "Generate constructor allowing partial initialization",
                        value: "constructor"
                    },
                    {
                        name: "Use specific naming convention",
                        value: "namingConvention"
                    }
                ],
                message: "Avaliable customizations",
                name: "selected",
                type: "checkbox"
            }
        ])) as any).selected;
        generationOptions.noConfigs = !customizations.includes("config");
        generationOptions.lazy = customizations.includes("lazy");
        generationOptions.activeRecord = customizations.includes(
            "activeRecord"
        );
        generationOptions.relationIds = customizations.includes("relationId");
        generationOptions.generateConstructor = customizations.includes(
            "constructor"
        );

        if (customizations.includes("namingStrategy")) {
            const namingStrategyPath = ((await inquirer.prompt([
                {
                    default: path.resolve(process.cwd()),
                    message: "Path to custom naming stategy file:",
                    name: "namingStrategy",
                    type: "input",
                    validate(value) {
                        const valid = value === "" || fs.existsSync(value);
                        return (
                            valid ||
                            "Please enter a a valid path to custom naming strategy file"
                        );
                    }
                }
            ])) as any).namingStrategy;

            if (namingStrategyPath && namingStrategyPath !== "") {
                // tslint:disable-next-line:no-var-requires
                const req = require(namingStrategyPath);
                generationOptions.namingStrategy = new req.NamingStrategy();
            } else {
                generationOptions.namingStrategy = new NamingStrategy();
            }
        }
        if (customizations.includes("namingConvention")) {
            const namingConventions = (await inquirer.prompt([
                {
                    choices: ["pascal", "param", "camel", "none"],
                    default: "none",
                    message: "Convert file names to specified case:",
                    name: "fileCase",
                    type: "list"
                },
                {
                    choices: ["pascal", "camel", "none"],
                    default: "none",
                    message: "Convert class names to specified case:",
                    name: "entityCase",
                    type: "list"
                },
                {
                    choices: ["pascal", "camel", "none"],
                    default: "none",
                    message: "Convert property names to specified case:",
                    name: "propertyCase",
                    type: "list"
                }
            ])) as any;
            generationOptions.convertCaseFile = namingConventions.fileCase;
            generationOptions.convertCaseProperty =
                namingConventions.propertyCase;
            generationOptions.convertCaseEntity = namingConventions.entityCase;
        }
    }
    return { driver, connectionOptions, generationOptions };
}
