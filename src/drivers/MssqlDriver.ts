import type * as MSSQL from "mssql";
import { ConnectionOptions } from "typeorm";
import * as TypeormDriver from "typeorm/driver/sqlserver/SqlServerDriver";
import { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults";
import * as TomgUtils from "../Utils";
import AbstractDriver from "./AbstractDriver";
import IConnectionOptions from "../IConnectionOptions";
import { Entity } from "../models/Entity";
import { Column } from "../models/Column";
import { Index } from "../models/Index";
import IGenerationOptions from "../IGenerationOptions";
import { RelationInternal } from "../models/RelationInternal";

export default class MssqlDriver extends AbstractDriver {
    public defaultValues: DataTypeDefaults = new TypeormDriver.SqlServerDriver({
        options: { replication: undefined } as ConnectionOptions,
    } as any).dataTypeDefaults;

    public readonly standardPort = 1433;

    public readonly standardSchema = "dbo";

    public readonly standardUser = "sa";

    private MSSQL: typeof MSSQL;

    private Connection: MSSQL.ConnectionPool;

    public constructor() {
        super();
        try {
            // eslint-disable-next-line import/no-extraneous-dependencies, global-require, import/no-unresolved
            this.MSSQL = require("mssql");
        } catch (error) {
            TomgUtils.LogError("", false, error);
            throw error;
        }
    }

    public async GetAllTables(
        schemas: string[],
        dbNames: string[]
    ): Promise<Entity[]> {
        const request = new this.MSSQL.Request(this.Connection);
        const response: {
            TABLE_SCHEMA: string;
            TABLE_NAME: string;
            DB_NAME: string;
        }[] = (
            await request.query(
                `SELECT TABLE_SCHEMA,TABLE_NAME, table_catalog as "DB_NAME" FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE='BASE TABLE' and TABLE_SCHEMA in (${MssqlDriver.buildEscapedObjectList(
            schemas
        )}) AND TABLE_CATALOG in (${MssqlDriver.buildEscapedObjectList(
                    dbNames
                )})`
            )
        ).recordset;
        // const response = await this.GetAllTablesQuery(schemas, dbNames);
        const ret: Entity[] = [] as Entity[];
        response.forEach((val) => {
            ret.push({
                columns: [],
                indices: [],
                relations: [],
                relationIds: [],
                sqlName: val.TABLE_NAME,
                tscName: val.TABLE_NAME,
                fileName: val.TABLE_NAME,
                database: dbNames.length > 1 ? val.DB_NAME : "",
                schema: val.TABLE_SCHEMA,
                fileImports: [],
            });
        });
        return ret;
    }

    public async GetCoulmnsFromEntity(
        entities: Entity[],
        schemas: string[],
        dbNames: string[]
    ): Promise<Entity[]> {
        const request = new this.MSSQL.Request(this.Connection);
        const response: {
            TABLE_NAME: string;
            COLUMN_NAME: string;
            TABLE_SCHEMA: string;
            COLUMN_DEFAULT: string;
            IS_NULLABLE: string;
            DATA_TYPE: string;
            CHARACTER_MAXIMUM_LENGTH: number;
            NUMERIC_PRECISION: number;
            NUMERIC_SCALE: number;
            IsIdentity: number;
            IsUnique: number;
        }[] = (
            await request.query(`SELECT c.TABLE_NAME,c.TABLE_SCHEMA,c.COLUMN_NAME,c.COLUMN_DEFAULT,IS_NULLABLE, DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE,
            COLUMNPROPERTY(object_id(c.TABLE_SCHEMA + '.'+ c.TABLE_NAME),c. COLUMN_NAME, 'IsIdentity') IsIdentity,
             CASE WHEN ISNULL(tc.cnt,0)>0 THEN 1 ELSE 0 END AS IsUnique
              FROM INFORMATION_SCHEMA.COLUMNS c
              LEFT JOIN (SELECT tc.TABLE_SCHEMA,tc.TABLE_NAME,cu.COLUMN_NAME,COUNT(1) AS cnt FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc inner join INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cu on cu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME where tc.CONSTRAINT_TYPE = 'UNIQUE' GROUP BY tc.TABLE_SCHEMA,tc.TABLE_NAME,cu.COLUMN_NAME) AS tc
               on tc.TABLE_NAME = c.TABLE_NAME and tc.COLUMN_NAME = c.COLUMN_NAME and tc.TABLE_SCHEMA=c.TABLE_SCHEMA
              where c.TABLE_SCHEMA in (${MssqlDriver.buildEscapedObjectList(
                  schemas
              )}) AND c.TABLE_CATALOG in (${MssqlDriver.buildEscapedObjectList(
                dbNames
            )}) order by ordinal_position
        `)
        ).recordset;
        entities.forEach((ent) => {
            response
                .filter((filterVal) => {
                    return (
                        filterVal.TABLE_NAME === ent.tscName &&
                        filterVal.TABLE_SCHEMA === ent.schema
                    );
                })
                .forEach((resp) => {
                    const tscName = resp.COLUMN_NAME;
                    const options: Column["options"] = {
                        name: resp.COLUMN_NAME,
                    };
                    if (resp.IS_NULLABLE === "YES") options.nullable = true;
                    if (resp.IsUnique === 1) options.unique = true;
                    const generated = resp.IsIdentity === 1 ? true : undefined;
                    const defaultValue = MssqlDriver.ReturnDefaultValueFunction(
                        resp.COLUMN_DEFAULT
                    );
                    const columnType = resp.DATA_TYPE;
                    let tscType = "";
                    switch (resp.DATA_TYPE) {
                        case "bigint":
                            tscType = "string";
                            break;
                        case "bit":
                            tscType = "boolean";
                            break;
                        case "decimal":
                            tscType = "number";
                            break;
                        case "int":
                            tscType = "number";
                            break;
                        case "money":
                            tscType = "number";
                            break;
                        case "numeric":
                            tscType = "number";
                            break;
                        case "smallint":
                            tscType = "number";
                            break;
                        case "smallmoney":
                            tscType = "number";
                            break;
                        case "tinyint":
                            tscType = "number";
                            break;
                        case "float":
                            tscType = "number";
                            break;
                        case "real":
                            tscType = "number";
                            break;
                        case "date":
                            tscType = "Date";
                            break;
                        case "datetime2":
                            tscType = "Date";
                            break;
                        case "datetime":
                            tscType = "Date";
                            break;
                        case "datetimeoffset":
                            tscType = "Date";
                            break;
                        case "smalldatetime":
                            tscType = "Date";
                            break;
                        case "time":
                            tscType = "Date";
                            break;
                        case "char":
                            tscType = "string";
                            break;
                        case "text":
                            tscType = "string";
                            break;
                        case "varchar":
                            tscType = "string";
                            break;
                        case "nchar":
                            tscType = "string";
                            break;
                        case "ntext":
                            tscType = "string";
                            break;
                        case "nvarchar":
                            tscType = "string";
                            break;
                        case "binary":
                            tscType = "Buffer";
                            break;
                        case "image":
                            tscType = "Buffer";
                            break;
                        case "varbinary":
                            tscType = "Buffer";
                            break;
                        case "hierarchyid":
                            tscType = "string";
                            break;
                        case "sql_variant":
                            tscType = "string";
                            break;
                        case "timestamp":
                            tscType = "Date";
                            break;
                        case "uniqueidentifier":
                            tscType = "string";
                            break;
                        case "xml":
                            tscType = "string";
                            break;
                        case "geometry":
                            tscType = "string";
                            break;
                        case "geography":
                            tscType = "string";
                            break;
                        default:
                            tscType = "NonNullable<unknown>";
                            TomgUtils.LogError(
                                `Unknown column type: ${resp.DATA_TYPE}  table name: ${resp.TABLE_NAME} column name: ${resp.COLUMN_NAME}`
                            );
                            break;
                    }

                    if (
                        this.ColumnTypesWithPrecision.some(
                            (v) => v === columnType
                        )
                    ) {
                        if (resp.NUMERIC_PRECISION !== null) {
                            options.precision = resp.NUMERIC_PRECISION;
                        }
                        if (resp.NUMERIC_SCALE !== null) {
                            options.scale = resp.NUMERIC_SCALE;
                        }
                    }
                    if (
                        this.ColumnTypesWithLength.some((v) => v === columnType)
                    ) {
                        options.length =
                            resp.CHARACTER_MAXIMUM_LENGTH > 0
                                ? resp.CHARACTER_MAXIMUM_LENGTH
                                : undefined;
                    }
                    ent.columns.push({
                        generated,
                        type: columnType,
                        default: defaultValue,
                        options,
                        tscName,
                        tscType,
                    });
                });
        });
        return entities;
    }

    public async GetIndexesFromEntity(
        entities: Entity[],
        schemas: string[],
        dbNames: string[]
    ): Promise<Entity[]> {
        const request = new this.MSSQL.Request(this.Connection);
        /* eslint-disable camelcase */
        const response: {
            TableName: string;
            TableSchema: string;
            IndexName: string;
            ColumnName: string;
            is_unique: boolean;
            is_primary_key: boolean;
        }[] = [];
        /* eslint-enable camelcase */
        /* eslint-disable no-await-in-loop */
        for (const dbName of dbNames) {
            if (dbNames.length > 1) {
                await this.UseDB(dbName);
            }
            const resp = (
                await request.query(`SELECT
                TableName = t.name,
                TableSchema = s.name,
                IndexName = ind.name,
                ColumnName = col.name,
                ind.is_unique,
                ind.is_primary_key
                FROM
                sys.indexes ind
                INNER JOIN
                sys.index_columns ic ON  ind.object_id = ic.object_id and ind.index_id = ic.index_id
                INNER JOIN
                sys.columns col ON ic.object_id = col.object_id and ic.column_id = col.column_id
                INNER JOIN
                sys.tables t ON ind.object_id = t.object_id
                INNER JOIN
                sys.schemas s on s.schema_id=t.schema_id
                WHERE
                t.is_ms_shipped = 0 and s.name in (${MssqlDriver.buildEscapedObjectList(
                    schemas
                )})
                    ORDER BY
                    t.name, ind.name, ind.index_id, ic.key_ordinal;`)
            ).recordset;
            response.push(...resp);
        }

        /* eslint-enable no-await-in-loop */
        entities.forEach((ent) => {
            const entityIndices = response.filter(
                (filterVal) =>
                    filterVal.TableName === ent.tscName &&
                    filterVal.TableSchema === ent.schema
            );
            const indexNames = new Set(entityIndices.map((v) => v.IndexName));
            indexNames.forEach((indexName) => {
                const records = entityIndices.filter(
                    (v) => v.IndexName === indexName
                );
                const indexInfo: Index = {
                    columns: [],
                    options: {},
                    name: records[0].IndexName,
                };
                if (records[0].is_primary_key) indexInfo.primary = true;
                if (records[0].is_unique) indexInfo.options.unique = true;
                records.forEach((record) => {
                    indexInfo.columns.push(record.ColumnName);
                });
                ent.indices.push(indexInfo);
            });
        });

        return entities;
    }

    public async GetRelations(
        entities: Entity[],
        schemas: string[],
        dbNames: string[],
        generationOptions: IGenerationOptions
    ): Promise<Entity[]> {
        const request = new this.MSSQL.Request(this.Connection);
        const response: {
            TableWithForeignKey: string;
            // eslint-disable-next-line camelcase
            FK_PartNo: number;
            ForeignKeyColumn: string;
            TableReferenced: string;
            ForeignKeyColumnReferenced: string;
            onDelete: "RESTRICT" | "CASCADE" | "SET_NULL" | "NO_ACTION";
            onUpdate: "RESTRICT" | "CASCADE" | "SET_NULL" | "NO_ACTION";
            objectId: number;
        }[] = [];
        /* eslint-disable no-await-in-loop */
        for (const dbName of dbNames) {
            if (dbNames.length > 1) {
                await this.UseDB(dbName);
            }
            const resp: {
                TableWithForeignKey: string;
                // eslint-disable-next-line camelcase
                FK_PartNo: number;
                ForeignKeyColumn: string;
                TableReferenced: string;
                ForeignKeyColumnReferenced: string;
                onDelete: "RESTRICT" | "CASCADE" | "SET_NULL" | "NO_ACTION";
                onUpdate: "RESTRICT" | "CASCADE" | "SET_NULL" | "NO_ACTION";
                objectId: number;
            }[] = (
                await request.query(`select
                parentTable.name as TableWithForeignKey,
                fkc.constraint_column_id as FK_PartNo,
                parentColumn.name as ForeignKeyColumn,
                referencedTable.name as TableReferenced,
                referencedColumn.name as ForeignKeyColumnReferenced,
                fk.delete_referential_action_desc as onDelete,
                fk.update_referential_action_desc as onUpdate,
                fk.object_id as objectId
                from
                sys.foreign_keys fk
                inner join
                sys.foreign_key_columns as fkc on fkc.constraint_object_id=fk.object_id
                inner join
                sys.tables as parentTable on fkc.parent_object_id = parentTable.object_id
                inner join
                sys.columns as parentColumn on fkc.parent_object_id = parentColumn.object_id and fkc.parent_column_id = parentColumn.column_id
                inner join
                sys.tables as referencedTable on fkc.referenced_object_id = referencedTable.object_id
                inner join
                sys.columns as referencedColumn on fkc.referenced_object_id = referencedColumn.object_id and fkc.referenced_column_id = referencedColumn.column_id
                inner join
                sys.schemas as parentSchema on parentSchema.schema_id=parentTable.schema_id
                where
                fk.is_disabled=0 and fk.is_ms_shipped=0 and parentSchema.name in (${MssqlDriver.buildEscapedObjectList(
                    schemas
                )})
                    order by
                    TableWithForeignKey, FK_PartNo`)
            ).recordset;
            response.push(...resp);
        }
        /* eslint-enable no-await-in-loop */

        const relationsTemp: RelationInternal[] = [] as RelationInternal[];
        const relationKeys = new Set(response.map((v) => v.objectId));

        relationKeys.forEach((relationId) => {
            const rows = response.filter((v) => v.objectId === relationId);
            const ownerTable = entities.find(
                (v) => v.sqlName === rows[0].TableWithForeignKey
            );
            const relatedTable = entities.find(
                (v) => v.sqlName === rows[0].TableReferenced
            );
            if (!ownerTable || !relatedTable) {
                TomgUtils.LogError(
                    `Relation between tables ${rows[0].TableWithForeignKey} and ${rows[0].TableReferenced} wasn't found in entity model.`,
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
            switch (rows[0].onDelete) {
                case "NO_ACTION":
                    break;
                case "SET_NULL":
                    internal.onDelete = "SET NULL";
                    break;
                default:
                    internal.onDelete = rows[0].onDelete;
                    break;
            }
            switch (rows[0].onUpdate) {
                case "NO_ACTION":
                    break;
                case "SET_NULL":
                    internal.onUpdate = "SET NULL";
                    break;
                default:
                    internal.onUpdate = rows[0].onUpdate;
                    break;
            }
            rows.forEach((row) => {
                internal.ownerColumns.push(row.ForeignKeyColumn);
                internal.relatedColumns.push(row.ForeignKeyColumnReferenced);
            });
            relationsTemp.push(internal);
        });

        const retVal = MssqlDriver.GetRelationsFromRelationTempInfo(
            relationsTemp,
            entities,
            generationOptions
        );
        return retVal;
    }

    public async DisconnectFromServer() {
        if (this.Connection) {
            await this.Connection.close();
        }
    }

    public async ConnectToServer(connectionOptons: IConnectionOptions) {
        const databaseName = connectionOptons.databaseNames[0];
        const config: MSSQL.config = {
            database: databaseName,
            options: {
                appName: "typeorm-model-generator",
                encrypt: connectionOptons.ssl,
                instanceName: connectionOptons.instanceName,
            },
            password: connectionOptons.password,
            port: connectionOptons.port,
            requestTimeout: 60 * 60 * 1000,
            server: connectionOptons.host,
            user: connectionOptons.user,
        };

        const promise = new Promise<boolean>((resolve, reject) => {
            this.Connection = new this.MSSQL.ConnectionPool(config, (err) => {
                if (!err) {
                    resolve(true);
                } else {
                    TomgUtils.LogError(
                        "Error connecting to MSSQL Server.",
                        false,
                        err.message
                    );
                    reject(err);
                }
            });
        });

        await promise;
    }

    public async CreateDB(dbName: string) {
        const request = new this.MSSQL.Request(this.Connection);
        await request.query(`CREATE DATABASE "${dbName}"; `);
    }

    public async UseDB(dbName: string) {
        const request = new this.MSSQL.Request(this.Connection);
        await request.query(`USE "${dbName}"; `);
    }

    public async DropDB(dbName: string) {
        const request = new this.MSSQL.Request(this.Connection);
        await request.query(`DROP DATABASE "${dbName}"; `);
    }

    public async CheckIfDBExists(dbName: string): Promise<boolean> {
        const request = new this.MSSQL.Request(this.Connection);
        const resp = await request.query(
            `SELECT name FROM master.sys.databases WHERE name = N'${dbName}' `
        );
        return resp.recordset.length > 0;
    }

    private static ReturnDefaultValueFunction(
        defVal: string | null
    ): string | undefined {
        let defaultValue = defVal;
        if (!defaultValue) {
            return undefined;
        }
        if (defaultValue.startsWith("(") && defaultValue.endsWith(")")) {
            defaultValue = defaultValue.slice(1, -1);
        }

        return `() => "${defaultValue}"`;
    }
}
