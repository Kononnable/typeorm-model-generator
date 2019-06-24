import path = require('path')
import { ConnectionOptions, createConnection } from "typeorm";
import * as ts from "typescript";
import * as yn from "yn"
import { AbstractDriver } from "../../src/drivers/AbstractDriver";
import { MariaDbDriver } from "../../src/drivers/MariaDbDriver";
import { MssqlDriver } from "../../src/drivers/MssqlDriver";
import { MysqlDriver } from "../../src/drivers/MysqlDriver";
import { OracleDriver } from "../../src/drivers/OracleDriver";
import { PostgresDriver } from "../../src/drivers/PostgresDriver";
import { SqliteDriver } from "../../src/drivers/SqliteDriver";
import { IConnectionOptions } from "../../src/IConnectionOptions";
import { IGenerationOptions } from "../../src/IGenerationOptions";

export function getGenerationOptions(resultsPath: string): IGenerationOptions {
    return {
        resultsPath: resultsPath,
        noConfigs: false,
        convertCaseEntity: 'none',
        convertCaseFile: 'none',
        convertCaseProperty: 'none',
        propertyVisibility: 'none',
        lazy: false,
        generateConstructor: false,
        customNamingStrategyPath: "",
        relationIds: false,
        detached: false,
        activeRecord: false
    }
}

export async function createMSSQLModels(filesOrgPath: string): Promise<IConnectionOptions> {

    let driver: AbstractDriver;
    driver = new MssqlDriver();
    const connectionOptions: IConnectionOptions = {
        host: String(process.env.MSSQL_Host),
        port: Number(process.env.MSSQL_Port),
        databaseName: `master`,
        user: String(process.env.MSSQL_Username),
        password: String(process.env.MSSQL_Password),
        databaseType: 'mssql',
        schemaName: 'dbo,sch1,sch2',
        ssl: yn(process.env.MSSQL_SSL),
    }
    await driver.ConnectToServer(connectionOptions);
    connectionOptions.databaseName = String(process.env.MSSQL_Database);

    if (await driver.CheckIfDBExists(String(process.env.MSSQL_Database))) {
        await driver.DropDB(String(process.env.MSSQL_Database));
    }
    await driver.CreateDB(String(process.env.MSSQL_Database));
    await driver.DisconnectFromServer();

    const connOpt: ConnectionOptions = {
        database: String(process.env.MSSQL_Database),
        host: String(process.env.MSSQL_Host),
        password: String(process.env.MSSQL_Password),
        type: 'mssql',
        username: String(process.env.MSSQL_Username),
        port: Number(process.env.MSSQL_Port),
        dropSchema: true,
        synchronize: false,
        entities: [path.resolve(filesOrgPath, '*.ts')],
        name: 'mssql'
    }

    const schemas = 'dbo,sch1,sch2'
    let conn = await createConnection(connOpt)
    let queryRunner = conn.createQueryRunner()
    for (const sch of schemas.split(',')) {
        await queryRunner.createSchema(sch, true);
    }
    await conn.synchronize();

    if (conn.isConnected) {
        await conn.close()
    }

    return connectionOptions;
}

export async function createPostgresModels(filesOrgPath: string): Promise<IConnectionOptions> {
    let driver: AbstractDriver;
    driver = new PostgresDriver();
    const connectionOptions: IConnectionOptions = {
        host: String(process.env.POSTGRES_Host),
        port: Number(process.env.POSTGRES_Port),
        databaseName: `postgres`,
        user: String(process.env.POSTGRES_Username),
        password: String(process.env.POSTGRES_Password),
        databaseType: 'postgres',
        schemaName: 'public,sch1,sch2',
        ssl: yn(process.env.POSTGRES_SSL),
    }
    await driver.ConnectToServer(connectionOptions);
    connectionOptions.databaseName = String(process.env.POSTGRES_Database);

    if (await driver.CheckIfDBExists(String(process.env.POSTGRES_Database))) {
        await driver.DropDB(String(process.env.POSTGRES_Database));
    }
    await driver.CreateDB(String(process.env.POSTGRES_Database));
    await driver.DisconnectFromServer();

    const connOpt: ConnectionOptions = {
        database: String(process.env.POSTGRES_Database),
        host: String(process.env.POSTGRES_Host),
        password: String(process.env.POSTGRES_Password),
        type: 'postgres',
        username: String(process.env.POSTGRES_Username),
        port: Number(process.env.POSTGRES_Port),
        dropSchema: true,
        synchronize: false,
        entities: [path.resolve(filesOrgPath, '*.ts')],
        name: 'postgres'
    }

    const schemas = 'public,sch1,sch2'
    let conn = await createConnection(connOpt)
    let queryRunner = conn.createQueryRunner()
    for (const sch of schemas.split(',')) {
        await queryRunner.createSchema(sch, true);
    }
    await conn.synchronize();

    if (conn.isConnected) {
        await conn.close()
    }

    return connectionOptions;
}

export async function createSQLiteModels(filesOrgPath: string): Promise<IConnectionOptions> {
    let driver: AbstractDriver;
    driver = new SqliteDriver();
    const connectionOptions: IConnectionOptions = {
        host: '',
        port: 0,
        databaseName: String(process.env.SQLITE_Database),
        user: '',
        password: '',
        databaseType: 'sqlite',
        schemaName: '',
        ssl: false,
    }
    await driver.ConnectToServer(connectionOptions);

    if (await driver.CheckIfDBExists(String(process.env.SQLITE_Database))) {
        await driver.DropDB(String(process.env.SQLITE_Database));
    }
    await driver.CreateDB(String(process.env.SQLITE_Database));
    await driver.DisconnectFromServer();

    const connOpt: ConnectionOptions = {
        database: String(process.env.SQLITE_Database),
        type: 'sqlite',
        dropSchema: true,
        synchronize: false,
        entities: [path.resolve(filesOrgPath, '*.ts')],
        name: 'sqlite'
    }

    let conn = await createConnection(connOpt)
    await conn.synchronize();

    if (conn.isConnected) {
        await conn.close()
    }

    return connectionOptions;
}

export async function createMysqlModels(filesOrgPath: string): Promise<IConnectionOptions> {
    let driver: AbstractDriver;
    driver = new MysqlDriver();
    const connectionOptions: IConnectionOptions = {
        host: String(process.env.MYSQL_Host),
        port: Number(process.env.MYSQL_Port),
        databaseName: String(process.env.MYSQL_Database),
        user: String(process.env.MYSQL_Username),
        password: String(process.env.MYSQL_Password),
        databaseType: 'mysql',
        schemaName: 'ignored',
        ssl: yn(process.env.MYSQL_SSL),
    }
    await driver.ConnectToServer(connectionOptions);

    if (await driver.CheckIfDBExists(String(process.env.MYSQL_Database))) {
        await driver.DropDB(String(process.env.MYSQL_Database));
    }
    await driver.CreateDB(String(process.env.MYSQL_Database));
    await driver.DisconnectFromServer();

    const connOpt: ConnectionOptions = {
        database: String(process.env.MYSQL_Database),
        host: String(process.env.MYSQL_Host),
        password: String(process.env.MYSQL_Password),
        type: 'mysql',
        username: String(process.env.MYSQL_Username),
        port: Number(process.env.MYSQL_Port),
        dropSchema: true,
        synchronize: true,
        entities: [path.resolve(filesOrgPath, '*.ts')],
        name: 'mysql'
    }
    const conn = await createConnection(connOpt)

    if (conn.isConnected) {
        await conn.close()
    }

    return connectionOptions;
}
export async function createMariaDBModels(filesOrgPath: string): Promise<IConnectionOptions> {
    let driver: AbstractDriver;
    driver = new MariaDbDriver();
    const connectionOptions: IConnectionOptions = {
        host: String(process.env.MARIADB_Host),
        port: Number(process.env.MARIADB_Port),
        databaseName: String(process.env.MARIADB_Database),
        user: String(process.env.MARIADB_Username),
        password: String(process.env.MARIADB_Password),
        databaseType: 'mariadb',
        schemaName: 'ignored',
        ssl: yn(process.env.MARIADB_SSL),
    }
    await driver.ConnectToServer(connectionOptions);

    if (await driver.CheckIfDBExists(String(process.env.MARIADB_Database))) {
        await driver.DropDB(String(process.env.MARIADB_Database));
    }
    await driver.CreateDB(String(process.env.MARIADB_Database));
    await driver.DisconnectFromServer();

    const connOpt: ConnectionOptions = {
        database: String(process.env.MARIADB_Database),
        host: String(process.env.MARIADB_Host),
        password: String(process.env.MARIADB_Password),
        type: 'mariadb',
        username: String(process.env.MARIADB_Username),
        port: Number(process.env.MARIADB_Port),
        dropSchema: true,
        synchronize: true,
        entities: [path.resolve(filesOrgPath, '*.ts')],
        name: 'mariadb'
    }
    const conn = await createConnection(connOpt)

    if (conn.isConnected) {
        await conn.close()
    }

    return connectionOptions;
}

export async function createOracleDBModels(filesOrgPath: string): Promise<IConnectionOptions> {
    let driver: AbstractDriver;
    driver = new OracleDriver();

    const connectionOptions: IConnectionOptions = {
        host: String(process.env.ORACLE_Host),
        port: Number(process.env.ORACLE_Port),
        databaseName: String(process.env.ORACLE_Database),
        user: String(process.env.ORACLE_UsernameSys),
        password: String(process.env.ORACLE_PasswordSys),
        databaseType: 'oracle',
        schemaName: String(process.env.ORACLE_Username),
        ssl: yn(process.env.ORACLE_SSL),
    }
    await driver.ConnectToServer(connectionOptions);
    connectionOptions.user = String(process.env.ORACLE_Username)
    connectionOptions.password = String(process.env.ORACLE_Password)

    if (await driver.CheckIfDBExists(String(process.env.ORACLE_Username))) {
        await driver.DropDB(String(process.env.ORACLE_Username));
    }
    await driver.CreateDB(String(process.env.ORACLE_Username));
    await driver.DisconnectFromServer();

    const connOpt: ConnectionOptions = {
        database: String(process.env.ORACLE_Database),
        sid: String(process.env.ORACLE_Database),
        host: String(process.env.ORACLE_Host),
        password: String(process.env.ORACLE_Password),
        type: 'oracle',
        username: String(process.env.ORACLE_Username),
        port: Number(process.env.ORACLE_Port),
        synchronize: true,
        entities: [path.resolve(filesOrgPath, '*.ts')],
        name: 'oracle',
    }
    const conn = await createConnection(connOpt)

    if (conn.isConnected) {
        await conn.close()
    }

    return connectionOptions;
}

export function compileTsFiles(fileNames: string[], options: ts.CompilerOptions): boolean {
    const program = ts.createProgram(fileNames, options);
    const emitResult = program.emit();
    let compileErrors = false;
    const preDiagnostics = ts.getPreEmitDiagnostics(program);

    const allDiagnostics = [...preDiagnostics, ...emitResult.diagnostics];

    allDiagnostics.forEach(diagnostic => {
        const lineAndCharacter = diagnostic.file!.getLineAndCharacterOfPosition(diagnostic.start!);
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        console.log(`${diagnostic.file!.fileName} (${lineAndCharacter.line + 1},${lineAndCharacter.character + 1}): ${message}`);
        compileErrors = true;
    });

    return compileErrors;
}

export function getEnabledDbDrivers() {
    const dbDrivers: string[] = [];
    if (process.env.SQLITE_Skip == '0') {
        dbDrivers.push('sqlite');
    }
    if (process.env.POSTGRES_Skip == '0') {
        dbDrivers.push('postgres');
    }
    if (process.env.MYSQL_Skip == '0') {
        dbDrivers.push('mysql');
    }
    if (process.env.MARIADB_Skip == '0') {
        dbDrivers.push('mariadb');
    }
    if (process.env.MSSQL_Skip == '0') {
        dbDrivers.push('mssql');
    }
    if (process.env.ORACLE_Skip == '0') {
        dbDrivers.push('oracle');
    }
    return dbDrivers;
}

export function createModelsInDb(dbDriver: string, filesOrgPathJS: string): Promise<IConnectionOptions> {
    switch (dbDriver) {
        case 'sqlite':
            return createSQLiteModels(filesOrgPathJS);
        case 'postgres':
            return createPostgresModels(filesOrgPathJS);
        case 'mysql':
            return createMysqlModels(filesOrgPathJS);
        case 'mariadb':
            return createMariaDBModels(filesOrgPathJS);
        case 'mssql':
            return createMSSQLModels(filesOrgPathJS);
        case 'oracle':
            return createOracleDBModels(filesOrgPathJS);
        default:
            console.log(`Unknown engine type`);
            throw new Error("Unknown engine type");
    }
}
