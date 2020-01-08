import * as TomgUtils from "./Utils";
import AbstractDriver from "./drivers/AbstractDriver";
import IConnectionOptions from "./IConnectionOptions";
import IGenerationOptions from "./IGenerationOptions";
import modelCustomizationPhase from "./ModelCustomization";
import modelGenerationPhase from "./ModelGeneration";
import { Entity } from "./models/Entity";

export function createDriver(driverName: string): AbstractDriver {
    switch (driverName) {
        case "mssql":
            try {
                require.resolve("mssql");
            } catch (e) {
                TomgUtils.LogError(
                    'MSSQL client not found. Please install the "mssql" package.',
                    false
                );
                throw e;
            }
            // eslint-disable-next-line global-require, new-cap
            return new (require("./drivers/MssqlDriver").default)();
        case "postgres":
            try {
                require.resolve("pg");
            } catch (e) {
                TomgUtils.LogError(
                    'PostgreSQL client not found. Please install the "pg" package.',
                    false
                );
                throw e;
            }
            // eslint-disable-next-line global-require, new-cap
            return new (require("./drivers/PostgresDriver").default)();
        case "mysql":
            try {
                require.resolve("mysql");
            } catch (e) {
                TomgUtils.LogError(
                    'MySQL client not found. Please install the "mysql" package.',
                    false
                );
                throw e;
            }
            // eslint-disable-next-line global-require, new-cap
            return new (require("./drivers/MysqlDriver").default)();
        case "mariadb":
            try {
                require.resolve("mysql");
            } catch (e) {
                TomgUtils.LogError(
                    'MariaDB client not found. Please install the "mysql" package.',
                    false
                );
                throw e;
            }
            // eslint-disable-next-line global-require, new-cap
            return new (require("./drivers/MariaDbDriver").default)();
        case "oracle":
            try {
                require.resolve("oracledb");
            } catch (e) {
                TomgUtils.LogError(
                    'Oracle client not found. Please install the "oracledb" package.',
                    false
                );
                throw e;
            }
            // eslint-disable-next-line global-require, new-cap
            return new (require("./drivers/OracleDriver").default)();
        case "sqlite":
            try {
                require.resolve("sqlite3");
            } catch (e) {
                TomgUtils.LogError(
                    'SQLite client not found. Please install the "sqlite3" package.',
                    false
                );
                throw e;
            }
            // eslint-disable-next-line global-require, new-cap
            return new (require("./drivers/SqliteDriver").default)();
        default:
            TomgUtils.LogError("Database engine not recognized.", false);
            throw new Error("Database engine not recognized.");
    }
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
