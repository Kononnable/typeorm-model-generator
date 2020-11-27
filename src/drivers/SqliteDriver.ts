import { ConnectionOptions } from "typeorm";
import * as TypeormDriver from "typeorm/driver/sqlite/SqliteDriver";
import { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults";
import type * as sqliteLib from "sqlite3";
import * as TomgUtils from "../Utils";
import AbstractDriver from "./AbstractDriver";
import IConnectionOptions from "../IConnectionOptions";
import { Entity } from "../models/Entity";
import { Column } from "../models/Column";
import { Index } from "../models/Index";
import IGenerationOptions from "../IGenerationOptions";
import { RelationInternal } from "../models/RelationInternal";

export default class SqliteDriver extends AbstractDriver {
    public defaultValues: DataTypeDefaults = new TypeormDriver.SqliteDriver({
        options: { database: "true" } as ConnectionOptions,
    } as any).dataTypeDefaults;

    public readonly standardPort = 0;

    public readonly standardUser = "";

    public readonly standardSchema = "";

    private sqliteLib: typeof sqliteLib;

    private sqlite: sqliteLib.sqlite3;

    private db: sqliteLib.Database;

    private tablesWithGeneratedPrimaryKey: string[] = new Array<string>();

    public GetAllTablesQuery: any;

    public constructor() {
        super();
        try {
            // eslint-disable-next-line import/no-extraneous-dependencies, global-require, import/no-unresolved
            this.sqliteLib = require("sqlite3");
            this.sqlite = this.sqliteLib.verbose();
        } catch (error) {
            TomgUtils.LogError("", false, error);
            throw error;
        }
    }

    public async GetAllTables(
        schema: string,
        dbNames: string
    ): Promise<Entity[]> {
        const ret: Entity[] = [] as Entity[];
        // eslint-disable-next-line camelcase
        const rows = await this.ExecQuery<{ tbl_name: string; sql: string }>(
            `SELECT tbl_name, sql FROM "sqlite_master" WHERE "type" = 'table'  AND name NOT LIKE 'sqlite_%'`
        );
        rows.forEach((val) => {
            if (val.sql.includes("AUTOINCREMENT")) {
                this.tablesWithGeneratedPrimaryKey.push(val.tbl_name);
            }
            ret.push({
                columns: [],
                indices: [],
                relations: [],
                relationIds: [],
                sqlName: val.tbl_name,
                tscName: val.tbl_name,
                fileName: val.tbl_name,
                fileImports: [],
            });
        });
        return ret;
    }

    public async GetCoulmnsFromEntity(entities: Entity[]): Promise<Entity[]> {
        await Promise.all(
            entities.map(async (ent) => {
                const response = await this.ExecQuery<{
                    cid: number;
                    name: string;
                    type: string;
                    notnull: number;
                    // eslint-disable-next-line camelcase
                    dflt_value: string;
                    pk: number;
                }>(`PRAGMA table_info('${ent.tscName}');`);
                response.forEach((resp) => {
                    const tscName = resp.name;
                    let tscType = "";
                    const options: Column["options"] = { name: resp.name };
                    if (resp.notnull === 0) options.nullable = true;
                    const isPrimary = resp.pk > 0 ? true : undefined;
                    const defaultValue = SqliteDriver.ReturnDefaultValueFunction(
                        resp.dflt_value
                    );
                    const columnType = resp.type
                        .replace(/\([0-9 ,]+\)/g, "")
                        .toLowerCase()
                        .trim();
                    const generated =
                        isPrimary &&
                        this.tablesWithGeneratedPrimaryKey.includes(ent.tscName)
                            ? true
                            : undefined;
                    switch (columnType) {
                        case "int":
                            tscType = "number";
                            break;
                        case "integer":
                            tscType = "number";
                            break;
                        case "int2":
                            tscType = "number";
                            break;
                        case "int8":
                            tscType = "number";
                            break;
                        case "tinyint":
                            tscType = "number";
                            break;
                        case "smallint":
                            tscType = "number";
                            break;
                        case "mediumint":
                            tscType = "number";
                            break;
                        case "bigint":
                            tscType = "string";
                            break;
                        case "unsigned big int":
                            tscType = "string";
                            break;
                        case "character":
                            tscType = "string";
                            break;
                        case "varchar":
                            tscType = "string";
                            break;
                        case "varying character":
                            tscType = "string";
                            break;
                        case "nchar":
                            tscType = "string";
                            break;
                        case "native character":
                            tscType = "string";
                            break;
                        case "nvarchar":
                            tscType = "string";
                            break;
                        case "text":
                            tscType = "string";
                            break;
                        case "blob":
                            tscType = "Buffer";
                            break;
                        case "clob":
                            tscType = "string";
                            break;
                        case "real":
                            tscType = "number";
                            break;
                        case "double":
                            tscType = "number";
                            break;
                        case "double precision":
                            tscType = "number";
                            break;
                        case "float":
                            tscType = "number";
                            break;
                        case "numeric":
                            tscType = "number";
                            break;
                        case "decimal":
                            tscType = "number";
                            break;
                        case "boolean":
                            tscType = "boolean";
                            break;
                        case "date":
                            tscType = "string";
                            break;
                        case "datetime":
                            tscType = "Date";
                            break;
                        default:
                            tscType = "NonNullable<unknown>";
                            TomgUtils.LogError(
                                `Unknown column type: ${columnType}  table name: ${ent.tscName} column name: ${resp.name}`
                            );
                            break;
                    }
                    const sqlOptions = resp.type.match(/\([0-9 ,]+\)/g);
                    if (
                        this.ColumnTypesWithPrecision.some(
                            (v) => v === columnType
                        ) &&
                        sqlOptions
                    ) {
                        options.precision = Number.parseInt(
                            sqlOptions[0]
                                .substring(1, sqlOptions[0].length - 1)
                                .split(",")[0],
                            10
                        );
                        options.scale = Number.parseInt(
                            sqlOptions[0]
                                .substring(1, sqlOptions[0].length - 1)
                                .split(",")[1],
                            10
                        );
                    }
                    if (
                        this.ColumnTypesWithLength.some(
                            (v) => v === columnType
                        ) &&
                        sqlOptions
                    ) {
                        options.length = Number.parseInt(
                            sqlOptions[0].substring(
                                1,
                                sqlOptions[0].length - 1
                            ),
                            10
                        );
                    }
                    if (
                        this.ColumnTypesWithWidth.some(
                            (v) => v === columnType && tscType !== "boolean"
                        ) &&
                        sqlOptions
                    ) {
                        options.width = Number.parseInt(
                            sqlOptions[0].substring(
                                1,
                                sqlOptions[0].length - 1
                            ),
                            10
                        );
                    }

                    ent.columns.push({
                        generated,
                        primary: isPrimary,
                        type: columnType,
                        default: defaultValue,
                        options,
                        tscName,
                        tscType,
                    });
                });
            })
        );

        return entities;
    }

    public async GetIndexesFromEntity(entities: Entity[]): Promise<Entity[]> {
        await Promise.all(
            entities.map(async (ent) => {
                const response = await this.ExecQuery<{
                    seq: number;
                    name: string;
                    unique: number;
                    origin: string;
                    partial: number;
                }>(`PRAGMA index_list('${ent.tscName}');`);
                await Promise.all(
                    response.map(async (resp) => {
                        const indexColumnsResponse = await this.ExecQuery<{
                            seqno: number;
                            cid: number;
                            name: string;
                        }>(`PRAGMA index_info('${resp.name}');`);

                        const indexInfo: Index = {
                            name: resp.name,
                            columns: [],
                            options: {},
                        };
                        if (resp.unique === 1) indexInfo.options.unique = true;

                        indexColumnsResponse.forEach((record) => {
                            indexInfo.columns.push(record.name);
                        });
                        if (
                            indexColumnsResponse.length === 1 &&
                            indexInfo.options.unique
                        ) {
                            ent.columns
                                .filter(
                                    (v) => v.tscName === indexInfo.columns[0]
                                )
                                .forEach((v) => {
                                    // eslint-disable-next-line no-param-reassign
                                    v.options.unique = true;
                                });
                        }
                        ent.indices.push(indexInfo);
                    })
                );
            })
        );

        return entities;
    }

    public async GetRelations(
        entities: Entity[],
        schema: string,
        dbNames: string,
        generationOptions: IGenerationOptions
    ): Promise<Entity[]> {
        let retVal = entities;
        await Promise.all(
            retVal.map(async (entity) => {
                const response = await this.ExecQuery<{
                    id: number;
                    seq: number;
                    table: string;
                    from: string;
                    to: string;
                    // eslint-disable-next-line camelcase
                    on_update:
                        | "RESTRICT"
                        | "CASCADE"
                        | "SET NULL"
                        | "NO ACTION";
                    // eslint-disable-next-line camelcase
                    on_delete:
                        | "RESTRICT"
                        | "CASCADE"
                        | "SET NULL"
                        | "NO ACTION";
                    match: string;
                }>(`PRAGMA foreign_key_list('${entity.tscName}');`);

                const relationsTemp: RelationInternal[] = [] as RelationInternal[];
                const relationKeys = new Set(response.map((v) => v.id));

                relationKeys.forEach((relationId) => {
                    const rows = response.filter((v) => v.id === relationId);
                    const ownerTable = entities.find(
                        (v) => v.sqlName === entity.tscName
                    );
                    const relatedTable = entities.find(
                        (v) => v.sqlName === rows[0].table
                    );
                    if (!ownerTable || !relatedTable) {
                        TomgUtils.LogError(
                            `Relation between tables ${entity.tscName} and ${rows[0].table} wasn't found in entity model.`,
                            true
                        );
                        return;
                    }
                    const internal: RelationInternal = {
                        ownerColumns: [],
                        relatedColumns: [],
                        ownerTable,
                        relatedTable,
                    };
                    if (rows[0].on_delete !== "NO ACTION") {
                        internal.onDelete = rows[0].on_delete;
                    }
                    if (rows[0].on_update !== "NO ACTION") {
                        internal.onUpdate = rows[0].on_update;
                    }
                    rows.forEach((row) => {
                        internal.ownerColumns.push(row.from);
                        internal.relatedColumns.push(row.to);
                    });
                    relationsTemp.push(internal);
                });

                retVal = SqliteDriver.GetRelationsFromRelationTempInfo(
                    relationsTemp,
                    retVal,
                    generationOptions
                );
            })
        );
        return retVal;
    }

    public async DisconnectFromServer() {
        this.db.close();
    }

    public async ConnectToServer(connectionOptons: IConnectionOptions) {
        await this.UseDB(connectionOptons.databaseName);
    }

    // eslint-disable-next-line class-methods-use-this
    public async CreateDB() {
        // not supported
    }

    public async UseDB(dbName: string) {
        const promise = new Promise<boolean>((resolve, reject) => {
            this.db = new this.sqlite.Database(dbName, (err) => {
                if (err) {
                    TomgUtils.LogError(
                        "Error connecting to SQLite database.",
                        false,
                        err.message
                    );
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        return promise;
    }

    // eslint-disable-next-line class-methods-use-this
    public async DropDB() {
        // not supported
    }

    // eslint-disable-next-line class-methods-use-this
    public async CheckIfDBExists(): Promise<boolean> {
        return true;
    }

    public async ExecQuery<T>(sql: string): Promise<T[]> {
        let ret: T[] = [];
        const promise = new Promise<boolean>((resolve, reject) => {
            this.db.serialize(() => {
                this.db.all(sql, [], (err, row) => {
                    if (!err) {
                        ret = row;
                        resolve(true);
                    } else {
                        TomgUtils.LogError(
                            "Error executing query on SQLite.",
                            false,
                            err.message
                        );
                        reject(err);
                    }
                });
            });
        });
        await promise;
        return ret;
    }

    private static ReturnDefaultValueFunction(
        defVal: string | null
    ): string | undefined {
        if (!defVal) {
            return undefined;
        }

        return `() => "${defVal}"`;
    }
}
