import { AbstractDriver } from "./drivers/AbstractDriver";
import { MssqlDriver } from "./drivers/MssqlDriver";
import { PostgresDriver } from "./drivers/PostgresDriver";
import { MysqlDriver } from "./drivers/MysqlDriver";
import { MariaDbDriver } from "./drivers/MariaDbDriver";
import { OracleDriver } from "./drivers/OracleDriver";
import { Engine } from "./Engine";
import * as Yargs from "yargs";
import * as TomgUtils from "./Utils";
import path = require("path");

var argv = Yargs.usage(
    "Usage: typeorm-model-generator -h <host> -d <database> -p [port] -u <user> -x [password] -e [engine]"
)
    .option("h", {
        alias: "host",
        describe: "IP adress/Hostname for database server.",
        demand: true
    })
    .option("d", {
        alias: "database",
        describe: "Database name.",
        demand: true
    })
    .option("u", {
        alias: "user",
        describe: "Username for database server.",
        demand: true
    })
    .option("x", {
        alias: "pass",
        describe: "Password for database server.",
        default: ""
    })
    .option("p", {
        alias: "port",
        describe: "Port number for database server."
    })
    .option("e", {
        alias: "engine",
        describe: "Database engine.",
        choices: ["mssql", "postgres", "mysql", "mariadb", "oracle"],
        default: "mssql"
    })
    .option("o", {
        alias: "output",
        describe: "Where to place generated models.",
        default: path.resolve(process.cwd(), "output")
    })
    .option("s", {
        alias: "schema",
        describe:
            "Schema name to create model from. Only for mssql and postgres."
    })
    .option("ssl", {
        boolean: true,
        default: false
    })
    .option("noConfig", {
        boolean: true,
        describe: `Doesn't create tsconfig.json and ormconfig.json`,
        default: false
    })
    .option("cf", {
        alias: "case-file",
        describe: "Convert file names to specified case",
        choices: ["pascal", "param", "camel", "none"],
        default: "none"
    })
    .option("ce", {
        alias: "case-entity",
        describe: "Convert class names to specified case",
        choices: ["pascal", "camel", "none"],
        default: "none"
    })
    .option("cp", {
        alias: "case-property",
        describe: "Convert property names to specified case",
        choices: ["pascal", "camel", "none"],
        default: "none"
    }).argv;

var driver: AbstractDriver;
var standardPort: number;
var standardSchema: string = "";
switch (argv.e) {
    case "mssql":
        driver = new MssqlDriver();
        standardPort = 1433;
        standardSchema = "dbo";
        break;
    case "postgres":
        driver = new PostgresDriver();
        standardPort = 5432;
        standardSchema = "public";
        break;
    case "mysql":
        driver = new MysqlDriver();
        standardPort = 3306;
        break;
    case "mariadb":
        driver = new MysqlDriver();
        standardPort = 3306;
        break;
    case "oracle":
        driver = new OracleDriver();
        standardPort = 1521;
        break;
    default:
        TomgUtils.LogError("Database engine not recognized.", false);
        throw new Error("Database engine not recognized.");
}

let engine = new Engine(driver, {
    host: argv.h,
    port: parseInt(argv.p) || standardPort,
    databaseName: argv.d ? argv.d.toString() : null,
    user: argv.u ? argv.u.toString() : null,
    password: argv.x ? argv.x.toString() : null,
    databaseType: argv.e,
    resultsPath: argv.o ? argv.o.toString() : null,
    schemaName: argv.s ? argv.s.toString() : standardSchema,
    ssl: argv.ssl,
    noConfigs: argv.noConfig,
    convertCaseFile: argv.cf,
    convertCaseEntity: argv.ce,
    convertCaseProperty: argv.cp
});

console.log(
    `[${new Date().toLocaleTimeString()}] Starting creation of model classes.`
);
engine.createModelFromDatabase().then(() => {
    console.info(
        `[${new Date().toLocaleTimeString()}] Typeorm model classes created.`
    );
});
