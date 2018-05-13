import * as ts from "typescript";
import { AbstractDriver } from "../../src/drivers/AbstractDriver";
import { MssqlDriver } from "../../src/drivers/MssqlDriver";
import { PostgresDriver } from "./../../src/drivers/PostgresDriver";
import { MysqlDriver } from "../../src/drivers/MysqlDriver";
import { MariaDbDriver } from "../../src/drivers/MariaDbDriver";
import { OracleDriver } from "../../src/drivers/OracleDriver";
import { SqliteDriver } from "../../src/drivers/SqliteDriver";
import { Engine } from "../../src/Engine";
import { createConnection, ConnectionOptions } from "typeorm";
import * as yn from "yn"
import path = require('path')

export async function createMSSQLModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {

    let driver: AbstractDriver;
    driver = new MssqlDriver();
    await driver.ConnectToServer(`master`, String(process.env.MSSQL_Host), Number(process.env.MSSQL_Port), String(process.env.MSSQL_Username), String(process.env.MSSQL_Password), yn(process.env.MSSQL_SSL));

    if (await driver.CheckIfDBExists(String(process.env.MSSQL_Database)))
        await driver.DropDB(String(process.env.MSSQL_Database));
    await driver.CreateDB(String(process.env.MSSQL_Database));
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        database: String(process.env.MSSQL_Database),
        host: String(process.env.MSSQL_Host),
        password: String(process.env.MSSQL_Password),
        type: 'mssql',
        username: String(process.env.MSSQL_Username),
        port: Number(process.env.MSSQL_Port),
        dropSchema: true,
        synchronize: false,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }

    let schemas = 'dbo,sch1,sch2'
    let conn = await createConnection(connOpt)
    let queryRunner = conn.createQueryRunner()
    for (const sch of schemas.split(',')) {
        await queryRunner.createSchema(sch, true);
    }
    await conn.synchronize();

    if (conn.isConnected)
        await conn.close()


    driver = new MssqlDriver();
    let engine = new Engine(
        driver, {
            host: String(process.env.MSSQL_Host),
            port: Number(process.env.MSSQL_Port),
            databaseName: String(process.env.MSSQL_Database),
            user: String(process.env.MSSQL_Username),
            password: String(process.env.MSSQL_Password),
            databaseType: 'mssql',
            resultsPath: resultsPath,
            schemaName: 'dbo,sch1,sch2',
            ssl: yn(process.env.MSSQL_SSL),
            noConfigs: false,
            convertCaseEntity: 'none',
            convertCaseFile: 'none',
            convertCaseProperty: 'none',
            lazy: false,
            constructor:false
        });

    conn = await createConnection(connOpt)
    queryRunner = conn.createQueryRunner()
    for (const sch of schemas.split(',')) {
        await queryRunner.createSchema(sch, true);
    }
    await conn.synchronize();
    if (conn.isConnected)
        await conn.close()

    return engine;
}

export async function createPostgresModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {
    let driver: AbstractDriver;
    driver = new PostgresDriver();
    await driver.ConnectToServer(`postgres`, String(process.env.POSTGRES_Host), Number(process.env.POSTGRES_Port), String(process.env.POSTGRES_Username), String(process.env.POSTGRES_Password), yn(process.env.POSTGRES_SSL));

    if (await driver.CheckIfDBExists(String(process.env.POSTGRES_Database)))
        await driver.DropDB(String(process.env.POSTGRES_Database));
    await driver.CreateDB(String(process.env.POSTGRES_Database));
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        database: String(process.env.POSTGRES_Database),
        host: String(process.env.POSTGRES_Host),
        password: String(process.env.POSTGRES_Password),
        type: 'postgres',
        username: String(process.env.POSTGRES_Username),
        port: Number(process.env.POSTGRES_Port),
        dropSchema: true,
        synchronize: false,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }

    let schemas = 'public,sch1,sch2'
    let conn = await createConnection(connOpt)
    let queryRunner = conn.createQueryRunner()
    for (const sch of schemas.split(',')) {
        await queryRunner.createSchema(sch, true);
    }
    await conn.synchronize();

    if (conn.isConnected)
        await conn.close()

    driver = new PostgresDriver();
    let engine = new Engine(
        driver, {
            host: String(process.env.POSTGRES_Host),
            port: Number(process.env.POSTGRES_Port),
            databaseName: String(process.env.POSTGRES_Database),
            user: String(process.env.POSTGRES_Username),
            password: String(process.env.POSTGRES_Password),
            databaseType: 'postgres',
            resultsPath: resultsPath,
            schemaName: 'public,sch1,sch2',
            ssl: yn(process.env.POSTGRES_SSL),
            noConfigs: false,
            convertCaseEntity: 'none',
            convertCaseFile: 'none',
            convertCaseProperty: 'none',
            lazy: false,
            constructor:false
        });

    conn = await createConnection(connOpt)
    queryRunner = conn.createQueryRunner()
    for (const sch of schemas.split(',')) {
        await queryRunner.createSchema(sch, true);
    }
    await conn.synchronize();
    if (conn.isConnected)
        await conn.close()

    return engine;
}

export async function createSQLiteModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {
    let driver: AbstractDriver;
    driver = new SqliteDriver();
    await driver.ConnectToServer(String(process.env.SQLITE_Database), '', 0, '', '', false);

    if (await driver.CheckIfDBExists(String(process.env.SQLITE_Database)))
        await driver.DropDB(String(process.env.SQLITE_Database));
    await driver.CreateDB(String(process.env.SQLITE_Database));
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        database: String(process.env.SQLITE_Database),
        type: 'sqlite',
        dropSchema: true,
        synchronize: false,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }

    let conn = await createConnection(connOpt)
    let queryRunner = conn.createQueryRunner()
    await conn.synchronize();

    if (conn.isConnected)
        await conn.close()

    driver = new SqliteDriver();
    let engine = new Engine(
        driver, {
            host: '',
            port: 0,
            databaseName: String(process.env.SQLITE_Database),
            user: '',
            password: '',
            databaseType: 'sqlite',
            resultsPath: resultsPath,
            schemaName: '',
            ssl: false,
            noConfigs: false,
            convertCaseEntity: 'none',
            convertCaseFile: 'none',
            convertCaseProperty: 'none',
            lazy: false,
            constructor:false
        });

    conn = await createConnection(connOpt)
    queryRunner = conn.createQueryRunner()
    await conn.synchronize();
    if (conn.isConnected)
        await conn.close()

    return engine;
}

export async function createMysqlModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {
    let driver: AbstractDriver;
    driver = new MysqlDriver();
    await driver.ConnectToServer(`mysql`, String(process.env.MYSQL_Host), Number(process.env.MYSQL_Port), String(process.env.MYSQL_Username), String(process.env.MYSQL_Password), yn(process.env.MYSQL_SSL));

    if (await driver.CheckIfDBExists(String(process.env.MYSQL_Database)))
        await driver.DropDB(String(process.env.MYSQL_Database));
    await driver.CreateDB(String(process.env.MYSQL_Database));
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        database: String(process.env.MYSQL_Database),
        host: String(process.env.MYSQL_Host),
        password: String(process.env.MYSQL_Password),
        type: 'mysql',
        username: String(process.env.MYSQL_Username),
        port: Number(process.env.MYSQL_Port),
        dropSchema: true,
        synchronize: true,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }
    let conn = await createConnection(connOpt)

    if (conn.isConnected)
        await conn.close()

    driver = new MysqlDriver();
    let engine = new Engine(
        driver, {
            host: String(process.env.MYSQL_Host),
            port: Number(process.env.MYSQL_Port),
            databaseName: String(process.env.MYSQL_Database),
            user: String(process.env.MYSQL_Username),
            password: String(process.env.MYSQL_Password),
            databaseType: 'mysql',
            resultsPath: resultsPath,
            schemaName: 'ignored',
            ssl: yn(process.env.MYSQL_SSL),
            noConfigs: false,
            convertCaseEntity: 'none',
            convertCaseFile: 'none',
            convertCaseProperty: 'none',
            lazy: false,
            constructor:false
        });

    return engine;
}
export async function createMariaDBModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {
    let driver: AbstractDriver;
    driver = new MariaDbDriver();
    await driver.ConnectToServer(`mysql`, String(process.env.MARIADB_Host), Number(process.env.MARIADB_Port), String(process.env.MARIADB_Username), String(process.env.MARIADB_Password), yn(process.env.MARIADB_SSL));

    if (await driver.CheckIfDBExists(String(process.env.MARIADB_Database)))
        await driver.DropDB(String(process.env.MARIADB_Database));
    await driver.CreateDB(String(process.env.MARIADB_Database));
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        database: String(process.env.MARIADB_Database),
        host: String(process.env.MARIADB_Host),
        password: String(process.env.MARIADB_Password),
        type: 'mariadb',
        username: String(process.env.MARIADB_Username),
        port: Number(process.env.MARIADB_Port),
        dropSchema: true,
        synchronize: true,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }
    let conn = await createConnection(connOpt)

    if (conn.isConnected)
        await conn.close()

    driver = new MariaDbDriver();
    let engine = new Engine(
        driver, {
            host: String(process.env.MARIADB_Host),
            port: Number(process.env.MARIADB_Port),
            databaseName: String(process.env.MARIADB_Database),
            user: String(process.env.MARIADB_Username),
            password: String(process.env.MARIADB_Password),
            databaseType: 'mariadb',
            resultsPath: resultsPath,
            schemaName: 'ignored',
            ssl: yn(process.env.MARIADB_SSL),
            noConfigs: false,
            convertCaseEntity: 'none',
            convertCaseFile: 'none',
            convertCaseProperty: 'none',
            lazy: false,
            constructor:false
        });



    return engine;
}

export async function createOracleDBModels(filesOrgPath: string, resultsPath: string): Promise<Engine> {
    let driver: AbstractDriver;
    driver = new OracleDriver();
    await driver.ConnectToServer(String(process.env.ORACLE_Database), String(process.env.ORACLE_Host), Number(process.env.ORACLE_Port), String(process.env.ORACLE_UsernameSys), String(process.env.ORACLE_PasswordSys), yn(process.env.ORACLE_SSL));

    if (await driver.CheckIfDBExists(String(process.env.ORACLE_Username)))
        await driver.DropDB(String(process.env.ORACLE_Username));
    await driver.CreateDB(String(process.env.ORACLE_Username));
    await driver.DisconnectFromServer();

    let connOpt: ConnectionOptions = {
        database: String(process.env.ORACLE_Database),
        sid: String(process.env.ORACLE_Database),
        host: String(process.env.ORACLE_Host),
        password: String(process.env.ORACLE_Password),
        type: 'oracle',
        username: String(process.env.ORACLE_Username),
        port: Number(process.env.ORACLE_Port),
        synchronize: true,
        entities: [path.resolve(filesOrgPath, '*.js')],
    }
    let conn = await createConnection(connOpt)

    if (conn.isConnected)
        await conn.close()

    driver = new OracleDriver();
    let engine = new Engine(
        driver, {
            host: String(process.env.ORACLE_Host),
            port: Number(process.env.ORACLE_Port),
            databaseName: String(process.env.ORACLE_Database),
            user: String(process.env.ORACLE_Username),
            password: String(process.env.ORACLE_Password),
            databaseType: 'oracle',
            resultsPath: resultsPath,
            schemaName: String(process.env.ORACLE_Username),
            ssl: yn(process.env.ORACLE_SSL),
            noConfigs: false,
            convertCaseEntity: 'none',
            convertCaseFile: 'none',
            convertCaseProperty: 'none',
            lazy: false,
            constructor:false
        });

    return engine;
}

export function compileTsFiles(fileNames: string[], options: ts.CompilerOptions): boolean {
    let program = ts.createProgram(fileNames, options);
    let emitResult = program.emit();
    let compileErrors = false;
    let preDiagnostics = ts.getPreEmitDiagnostics(program);

    let allDiagnostics = [...preDiagnostics, ...emitResult.diagnostics];

    allDiagnostics.forEach(diagnostic => {
        let lineAndCharacter = diagnostic.file!.getLineAndCharacterOfPosition(diagnostic.start!);
        let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        console.log(`${diagnostic.file!.fileName} (${lineAndCharacter.line + 1},${lineAndCharacter.character + 1}): ${message}`);
        compileErrors = true;
    });

    return compileErrors;
}
