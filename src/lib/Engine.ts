import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as TomgUtils from "./Utils";
import AbstractDriver from "./drivers/AbstractDriver";
import IConnectionOptions from "./IConnectionOptions";
import IGenerationOptions from "./IGenerationOptions";
import modelCustomizationPhase from "./ModelCustomization";
import modelGenerationPhase from "./ModelGeneration";
import { Entity } from "./models";

export interface DriverDescriptor {
    dep: string;
    driver: string;
}

const packageDir = path.resolve(__dirname, "../../");

export async function loadDriver(
    driverName: string,
    descriptor: DriverDescriptor
) {
    const { dep, driver } = descriptor;
    try {
        require.resolve(dep);
    } catch (e) {
        TomgUtils.LogError(
            `Client for "${driverName}" engine not found.`,
            false
        );

        const envFile = path.resolve(packageDir, "install_env.json");
        const envFileContents: typeof process.env = fs.existsSync(envFile)
            ? // eslint-disable-next-line import/no-dynamic-require, global-require
              require(envFile)
            : {};

        if (envFileContents.npm_config_global) {
            await installDriver(dep, envFileContents);
        } else {
            console.error(`Please install the "${dep}" package manually.`);
            throw e;
        }
    }
    // eslint-disable-next-line global-require, new-cap, import/no-dynamic-require
    return new (require(driver).default)();
}

export async function installDriver(
    dep: string,
    env: typeof process.env
): Promise<void> {
    console.error(`Attempting to install "${dep}" automatically`);
    const { npm_node_execpath: nodeBin, npm_execpath: npmBin } = env;
    if (!nodeBin || !npmBin) {
        throw new Error(
            "Package manager did not include sufficient env variables during install. Reinstalling this package might fix this problem"
        );
    }
    console.error(
        execFileSync(nodeBin, [npmBin, "install", dep], {
            cwd: packageDir
        }).toString("latin1")
    );
    await new Promise(done =>
        setTimeout(() => {
            done();
        }, 0)
    );
    console.error("Attempting to continue after installation");
}

export async function createDriver(
    driverName: string
): Promise<AbstractDriver> {
    const driverMap: {
        [driverName: string]: DriverDescriptor;
    } = {
        mssql: {
            dep: "mssql",
            driver: "./drivers/MssqlDriver"
        },
        postgres: {
            dep: "pg",
            driver: "./drivers/PostgresDriver"
        },
        mysql: {
            dep: "mysql",
            driver: "./drivers/MysqlDriver"
        },
        mariadb: {
            dep: "mysql",
            driver: "./drivers/MariaDbDriver"
        },
        oracle: {
            dep: "oracledb",
            driver: "./drivers/OracleDriver"
        },
        sqlite: {
            dep: "sqlite3",
            driver: "./drivers/SqliteDriver"
        }
    };
    if (typeof driverMap[driverName] === "undefined") {
        TomgUtils.LogError("Database engine not recognized.", false);
        throw new Error("Database engine not recognized.");
    }
    return loadDriver(driverName, driverMap[driverName]);
}

export async function createModelFromDatabase(
    driver: AbstractDriver,
    connectionOptions: IConnectionOptions,
    generationOptions: IGenerationOptions
): Promise<void> {
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
    modelGenerationPhase(connectionOptions, generationOptions, dbModel);
}
export async function dataCollectionPhase(
    driver: AbstractDriver,
    connectionOptions: IConnectionOptions,
    generationOptions: IGenerationOptions
): Promise<Entity[]> {
    return driver.GetDataFromServer(connectionOptions, generationOptions);
}
