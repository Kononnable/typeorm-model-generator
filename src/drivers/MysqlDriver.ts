import { AbstractDriver } from "./AbstractDriver";
import * as MYSQL from "mysql";
import { ColumnInfo } from "./../models/ColumnInfo";
import { EntityInfo } from "./../models/EntityInfo";
import * as TomgUtils from "./../Utils";

export class MysqlDriver extends AbstractDriver {
    readonly EngineName: string = "MySQL";

    GetAllTablesQuery = async (schema: string) => {
        let response = this.ExecQuery<{
            TABLE_SCHEMA: string;
            TABLE_NAME: string;
        }>(`SELECT TABLE_SCHEMA, TABLE_NAME
            FROM information_schema.tables
            WHERE table_type='BASE TABLE'
            AND table_schema like DATABASE()`);
        return response;
    };

    async GetCoulmnsFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let response = await this.ExecQuery<{
            TABLE_NAME: string;
            COLUMN_NAME: string;
            COLUMN_DEFAULT: string;
            IS_NULLABLE: string;
            DATA_TYPE: string;
            CHARACTER_MAXIMUM_LENGTH: number;
            NUMERIC_PRECISION: number;
            NUMERIC_SCALE: number;
            IsIdentity: number;
            column_type: string;
            column_key: string;
        }>(`SELECT TABLE_NAME,COLUMN_NAME,COLUMN_DEFAULT,IS_NULLABLE,
            DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE,
            CASE WHEN EXTRA like '%auto_increment%' THEN 1 ELSE 0 END IsIdentity, column_type, column_key
            FROM INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA like DATABASE()`);
        entities.forEach(ent => {
            response
                .filter(filterVal => {
                    return filterVal.TABLE_NAME == ent.EntityName;
                })
                .forEach(resp => {
                    let colInfo: ColumnInfo = new ColumnInfo();
                    colInfo.name = resp.COLUMN_NAME;
                    colInfo.is_nullable = resp.IS_NULLABLE == "YES";
                    colInfo.is_generated = resp.IsIdentity == 1;
                    colInfo.is_unique = resp.column_key == "UNI";
                    colInfo.default = resp.COLUMN_DEFAULT;
                    colInfo.sql_type = resp.DATA_TYPE;
                    switch (resp.DATA_TYPE) {
                        case "int":
                            colInfo.ts_type = "number";
                            break;
                        case "tinyint":
                            if (resp.column_type == "tinyint(1)") {
                                colInfo.width = 1;
                                colInfo.ts_type = "boolean";
                            } else {
                                colInfo.ts_type = "number";
                            }
                            break;
                        case "smallint":
                            colInfo.ts_type = "number";
                            break;
                        case "mediumint":
                            colInfo.ts_type = "number";
                            break;
                        case "bigint":
                            colInfo.ts_type = "string";
                            break;
                        case "float":
                            colInfo.ts_type = "number";
                            break;
                        case "double":
                            colInfo.ts_type = "number";
                            break;
                        case "decimal":
                            colInfo.ts_type = "string";
                            break;
                        case "date":
                            colInfo.ts_type = "string";
                            break;
                        case "datetime":
                            colInfo.ts_type = "Date";
                            break;
                        case "timestamp":
                            colInfo.ts_type = "Date";
                            break;
                        case "time":
                            colInfo.ts_type = "string";
                            break;
                        case "year":
                            colInfo.ts_type = "number";
                            break;
                        case "char":
                            colInfo.ts_type = "string";
                            break;
                        case "varchar":
                            colInfo.ts_type = "string";
                            break;
                        case "blob":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "text":
                            colInfo.ts_type = "string";
                            break;
                        case "tinyblob":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "tinytext":
                            colInfo.ts_type = "string";
                            break;
                        case "mediumblob":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "mediumtext":
                            colInfo.ts_type = "string";
                            break;
                        case "longblob":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "longtext":
                            colInfo.ts_type = "string";
                            break;
                        case "enum":
                            colInfo.ts_type = "string";
                            colInfo.enumOptions = resp.column_type
                                .substring(5, resp.column_type.length - 1)
                                .replace(/\'/gi, '"');
                            break;
                        case "json":
                            colInfo.ts_type = "Object";
                            break;
                        case "binary":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "geometry":
                            colInfo.ts_type = "string";
                            break;
                        case "point":
                            colInfo.ts_type = "string";
                            break;
                        case "linestring":
                            colInfo.ts_type = "string";
                            break;
                        case "polygon":
                            colInfo.ts_type = "string";
                            break;
                        case "multipoint":
                            colInfo.ts_type = "string";
                            break;
                        case "multilinestring":
                            colInfo.ts_type = "string";
                            break;
                        case "multipolygon":
                            colInfo.ts_type = "string";
                            break;
                        case "geometrycollection":
                            colInfo.ts_type = "string";
                            break;
                        default:
                            TomgUtils.LogError(
                                `Unknown column type: ${
                                    resp.DATA_TYPE
                                }  table name: ${
                                    resp.TABLE_NAME
                                } column name: ${resp.COLUMN_NAME}`
                            );
                            break;
                    }
                    if (
                        this.ColumnTypesWithPrecision.some(
                            v => v == colInfo.sql_type
                        )
                    ) {
                        colInfo.numericPrecision = resp.NUMERIC_PRECISION;
                        colInfo.numericScale = resp.NUMERIC_SCALE;
                    }
                    if (
                        this.ColumnTypesWithLength.some(
                            v => v == colInfo.sql_type
                        )
                    ) {
                        colInfo.lenght =
                            resp.CHARACTER_MAXIMUM_LENGTH > 0
                                ? resp.CHARACTER_MAXIMUM_LENGTH
                                : null;
                    }
                    if (
                        this.ColumnTypesWithWidth.some(
                            v =>
                                v == colInfo.sql_type &&
                                colInfo.ts_type != "boolean"
                        )
                    ) {
                        colInfo.width =
                            resp.CHARACTER_MAXIMUM_LENGTH > 0
                                ? resp.CHARACTER_MAXIMUM_LENGTH
                                : null;
                    }

                    if (colInfo.sql_type) ent.Columns.push(colInfo);
                });
        });
        return entities;
    }
    async GetIndexesFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let response = await this.ExecQuery<{
            TableName: string;
            IndexName: string;
            ColumnName: string;
            is_unique: number;
            is_primary_key: number;
        }>(`SELECT TABLE_NAME TableName,INDEX_NAME IndexName,COLUMN_NAME ColumnName,CASE WHEN NON_UNIQUE=0 THEN 1 ELSE 0 END is_unique,
            CASE WHEN INDEX_NAME='PRIMARY' THEN 1 ELSE 0 END is_primary_key
            FROM information_schema.statistics sta
            WHERE table_schema like DATABASE();
            `);
        entities.forEach(ent => {
            response
                .filter(filterVal => {
                    return filterVal.TableName == ent.EntityName;
                })
                .forEach(resp => {
                    let indexInfo: IndexInfo = <IndexInfo>{};
                    let indexColumnInfo: IndexColumnInfo = <IndexColumnInfo>{};
                    if (
                        ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp.IndexName;
                        }).length > 0
                    ) {
                        indexInfo = ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp.IndexName;
                        })[0];
                    } else {
                        indexInfo.columns = <IndexColumnInfo[]>[];
                        indexInfo.name = resp.IndexName;
                        indexInfo.isUnique = resp.is_unique == 1;
                        indexInfo.isPrimaryKey = resp.is_primary_key == 1;
                        ent.Indexes.push(indexInfo);
                    }
                    indexColumnInfo.name = resp.ColumnName;
                    indexInfo.columns.push(indexColumnInfo);
                });
        });

        return entities;
    }
    async GetRelations(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let response = await this.ExecQuery<{
            TableWithForeignKey: string;
            FK_PartNo: number;
            ForeignKeyColumn: string;
            TableReferenced: string;
            ForeignKeyColumnReferenced: string;
            onDelete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO_ACTION";
            onUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | "NO_ACTION";
            object_id: string;
        }>(`SELECT
            CU.TABLE_NAME TableWithForeignKey,
            CU.ORDINAL_POSITION FK_PartNo,
            CU.COLUMN_NAME ForeignKeyColumn,
            CU.REFERENCED_TABLE_NAME TableReferenced,
            CU.REFERENCED_COLUMN_NAME ForeignKeyColumnReferenced,
            RC.DELETE_RULE onDelete,
            RC.UPDATE_RULE onUpdate,
            CU.CONSTRAINT_NAME object_id
           FROM
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE CU
           JOIN
            INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS RC ON CU.CONSTRAINT_NAME=RC.CONSTRAINT_NAME
          WHERE
            TABLE_SCHEMA = SCHEMA()
            AND CU.REFERENCED_TABLE_NAME IS NOT NULL;
            `);
        let relationsTemp: RelationTempInfo[] = <RelationTempInfo[]>[];
        response.forEach(resp => {
            let rels = relationsTemp.find(val => {
                return val.object_id == resp.object_id;
            });
            if (rels == undefined) {
                rels = <RelationTempInfo>{};
                rels.ownerColumnsNames = [];
                rels.referencedColumnsNames = [];
                rels.actionOnDelete =
                    resp.onDelete == "NO_ACTION" ? null : resp.onDelete;
                rels.actionOnUpdate =
                    resp.onUpdate == "NO_ACTION" ? null : resp.onUpdate;
                rels.object_id = resp.object_id;
                rels.ownerTable = resp.TableWithForeignKey;
                rels.referencedTable = resp.TableReferenced;
                relationsTemp.push(rels);
            }
            rels.ownerColumnsNames.push(resp.ForeignKeyColumn);
            rels.referencedColumnsNames.push(resp.ForeignKeyColumnReferenced);
        });
        entities = this.GetRelationsFromRelationTempInfo(
            relationsTemp,
            entities
        );
        return entities;
    }
    async DisconnectFromServer() {
        let promise = new Promise<boolean>((resolve, reject) => {
            this.Connection.end(err => {
                if (!err) {
                    resolve(true);
                } else {
                    TomgUtils.LogError(
                        `Error disconnecting to ${this.EngineName} Server.`,
                        false,
                        err.message
                    );
                    reject(err);
                }
            });
        });
        if (this.Connection) await promise;
    }

    private Connection: MYSQL.Connection;
    async ConnectToServer(
        database: string,
        server: string,
        port: number,
        user: string,
        password: string,
        ssl: boolean
    ) {
        let config: MYSQL.ConnectionConfig;
        if (ssl) {
            config = {
                database: database,
                host: server,
                port: port,
                user: user,
                password: password,
                ssl: {
                    rejectUnauthorized: false
                }
            };
        } else {
            config = {
                database: database,
                host: server,
                port: port,
                user: user,
                password: password
            };
        }

        let promise = new Promise<boolean>((resolve, reject) => {
            this.Connection = MYSQL.createConnection(config);

            this.Connection.connect(err => {
                if (!err) {
                    resolve(true);
                } else {
                    TomgUtils.LogError(
                        `Error connecting to ${this.EngineName} Server.`,
                        false,
                        err.message
                    );
                    reject(err);
                }
            });
        });

        await promise;
    }
    async CreateDB(dbName: string) {
        await this.ExecQuery<any>(`CREATE DATABASE ${dbName}; `);
    }
    async UseDB(dbName: string) {
        await this.ExecQuery<any>(`USE ${dbName}; `);
    }
    async DropDB(dbName: string) {
        await this.ExecQuery<any>(`DROP DATABASE ${dbName}; `);
    }
    async CheckIfDBExists(dbName: string): Promise<boolean> {
        let resp = await this.ExecQuery<any>(
            `SHOW DATABASES LIKE '${dbName}' `
        );
        return resp.length > 0;
    }
    async ExecQuery<T>(sql: string): Promise<Array<T>> {
        let ret: Array<T> = [];
        let query = this.Connection.query(sql);
        let stream = query.stream({});
        let promise = new Promise<boolean>((resolve, reject) => {
            stream.on("data", chunk => {
                ret.push(<T>(<any>chunk));
            });
            stream.on("error", err => reject(err));
            stream.on("end", () => resolve(true));
        });
        await promise;
        return ret;
    }
}
