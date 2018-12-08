import path = require("path");
import * as Yargs from "yargs";
import { AbstractNamingStrategy } from "./AbstractNamingStrategy";
import { AbstractDriver } from "./drivers/AbstractDriver";
import { MariaDbDriver } from "./drivers/MariaDbDriver";
import { MssqlDriver } from "./drivers/MssqlDriver";
import { MysqlDriver } from "./drivers/MysqlDriver";
import { OracleDriver } from "./drivers/OracleDriver";
import { PostgresDriver } from "./drivers/PostgresDriver";
import { SqliteDriver } from "./drivers/SqliteDriver";
import { Engine } from "./Engine";
import { NamingStrategy } from "./NamingStrategy";
import * as TomgUtils from "./Utils";

const argv = Yargs.usage(
    "Usage: typeorm-model-generator -h <host> -d <database> -p [port] -u <user> -x [password] -e [engine]"
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
        choices: ["mssql", "postgres", "mysql", "mariadb", "oracle", "sqlite"],
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
        describe: "Defines which visibility should have the generated property"
    })
    .option("lazy", {
        boolean: true,
        default: false,
        describe: "Generate lazy relations"
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

let driver: AbstractDriver;
let standardPort: number;
let standardSchema: string = "";
let standardUser: string = "";
switch (argv.e) {
    case "mssql":
        driver = new MssqlDriver();
        standardPort = 1433;
        standardSchema = "dbo";
        standardUser = "sa";
        break;
    case "postgres":
        driver = new PostgresDriver();
        standardPort = 5432;
        standardSchema = "public";
        standardUser = "postgres";
        break;
    case "mysql":
        driver = new MysqlDriver();
        standardPort = 3306;
        standardUser = "root";
        break;
    case "mariadb":
        driver = new MariaDbDriver();
        standardPort = 3306;
        standardUser = "root";
        break;
    case "oracle":
        driver = new OracleDriver();
        standardPort = 1521;
        standardUser = "SYS";
        break;
    case "sqlite":
        driver = new SqliteDriver();
        standardPort = 0;
        break;
    default:
        TomgUtils.LogError("Database engine not recognized.", false);
        throw new Error("Database engine not recognized.");
}
let namingStrategy: AbstractNamingStrategy;
if (argv.namingStrategy && argv.namingStrategy !== "") {
    const req = require(argv.namingStrategy);
    namingStrategy = new req.NamingStrategy();
} else {
    namingStrategy = new NamingStrategy();
}

const engine = new Engine(driver, {
    constructor: argv.generateConstructor,
    convertCaseEntity: argv.ce,
    convertCaseFile: argv.cf,
    convertCaseProperty: argv.cp,
    databaseName: argv.d ? argv.d.toString() : null,
    databaseType: argv.e,
    host: argv.h,
    lazy: argv.lazy,
    namingStrategy,
    noConfigs: argv.noConfig,
    password: argv.x ? argv.x.toString() : null,
    port: parseInt(argv.p, 10) || standardPort,
    propertyVisibility: argv.pv,
    relationIds: argv.relationIds,
    resultsPath: argv.o ? argv.o.toString() : null,
    schemaName: argv.s ? argv.s.toString() : standardSchema,
    ssl: argv.ssl,
    user: argv.u ? argv.u.toString() : standardUser
});

console.log(TomgUtils.packageVersion());
console.log(
    `[${new Date().toLocaleTimeString()}] Starting creation of model classes.`
);
engine.createModelFromDatabase().then(() => {
    console.info(
        `[${new Date().toLocaleTimeString()}] Typeorm model classes created.`
    );
});
