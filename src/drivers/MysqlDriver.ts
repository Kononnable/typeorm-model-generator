import * as MYSQL from "mysql";
import { ColumnInfo } from "../models/ColumnInfo";
import { EntityInfo } from "../models/EntityInfo";
import * as TomgUtils from "../Utils";
import { AbstractDriver } from "./AbstractDriver";

export class MysqlDriver extends AbstractDriver {
    public readonly EngineName: string = "MySQL";

    private Connection: MYSQL.Connection;

    public GetAllTablesQuery = async (schema: string) => {
        const response = this.ExecQuery<{
            TABLE_SCHEMA: string;
            TABLE_NAME: string;
        }>(`SELECT TABLE_SCHEMA, TABLE_NAME
            FROM information_schema.tables
            WHERE table_type='BASE TABLE'
            AND table_schema like DATABASE()`);
        return response;
    };

    public async GetCoulmnsFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        const response = await this.ExecQuery<{
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
                .filter(filterVal => filterVal.TABLE_NAME === ent.EntityName)
                .forEach(resp => {
                    const colInfo: ColumnInfo = new ColumnInfo();
                    colInfo.tsName = resp.COLUMN_NAME;
                    colInfo.sqlName = resp.COLUMN_NAME;
                    colInfo.isNullable = resp.IS_NULLABLE === "YES";
                    colInfo.isGenerated = resp.IsIdentity === 1;
                    colInfo.isUnique = resp.column_key === "UNI";
                    colInfo.default = resp.COLUMN_DEFAULT;
                    colInfo.sqlType = resp.DATA_TYPE;
                    switch (resp.DATA_TYPE) {
                        case "int":
                            colInfo.tsType = "number";
                            break;
                        case "tinyint":
                            if (resp.column_type === "tinyint(1)") {
                                colInfo.width = 1;
                                colInfo.tsType = "boolean";
                            } else {
                                colInfo.tsType = "number";
                            }
                            break;
                        case "smallint":
                            colInfo.tsType = "number";
                            break;
                        case "mediumint":
                            colInfo.tsType = "number";
                            break;
                        case "bigint":
                            colInfo.tsType = "string";
                            break;
                        case "float":
                            colInfo.tsType = "number";
                            break;
                        case "double":
                            colInfo.tsType = "number";
                            break;
                        case "decimal":
                            colInfo.tsType = "string";
                            break;
                        case "date":
                            colInfo.tsType = "string";
                            break;
                        case "datetime":
                            colInfo.tsType = "Date";
                            break;
                        case "timestamp":
                            colInfo.tsType = "Date";
                            break;
                        case "time":
                            colInfo.tsType = "string";
                            break;
                        case "year":
                            colInfo.tsType = "number";
                            break;
                        case "char":
                            colInfo.tsType = "string";
                            break;
                        case "varchar":
                            colInfo.tsType = "string";
                            break;
                        case "blob":
                            colInfo.tsType = "Buffer";
                            break;
                        case "text":
                            colInfo.tsType = "string";
                            break;
                        case "tinyblob":
                            colInfo.tsType = "Buffer";
                            break;
                        case "tinytext":
                            colInfo.tsType = "string";
                            break;
                        case "mediumblob":
                            colInfo.tsType = "Buffer";
                            break;
                        case "mediumtext":
                            colInfo.tsType = "string";
                            break;
                        case "longblob":
                            colInfo.tsType = "Buffer";
                            break;
                        case "longtext":
                            colInfo.tsType = "string";
                            break;
                        case "enum":
                            colInfo.tsType = "string";
                            colInfo.enumOptions = resp.column_type
                                .substring(5, resp.column_type.length - 1)
                                .replace(/\'/gi, '"');
                            break;
                        case "json":
                            colInfo.tsType = "Object";
                            break;
                        case "binary":
                            colInfo.tsType = "Buffer";
                            break;
                        case "geometry":
                            colInfo.tsType = "string";
                            break;
                        case "point":
                            colInfo.tsType = "string";
                            break;
                        case "linestring":
                            colInfo.tsType = "string";
                            break;
                        case "polygon":
                            colInfo.tsType = "string";
                            break;
                        case "multipoint":
                            colInfo.tsType = "string";
                            break;
                        case "multilinestring":
                            colInfo.tsType = "string";
                            break;
                        case "multipolygon":
                            colInfo.tsType = "string";
                            break;
                        case "geometrycollection":
                            colInfo.tsType = "string";
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
                            v => v === colInfo.sqlType
                        )
                    ) {
                        colInfo.numericPrecision = resp.NUMERIC_PRECISION;
                        colInfo.numericScale = resp.NUMERIC_SCALE;
                    }
                    if (
                        this.ColumnTypesWithLength.some(
                            v => v === colInfo.sqlType
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
                                v === colInfo.sqlType &&
                                colInfo.tsType !== "boolean"
                        )
                    ) {
                        colInfo.width =
                            resp.CHARACTER_MAXIMUM_LENGTH > 0
                                ? resp.CHARACTER_MAXIMUM_LENGTH
                                : null;
                    }

                    if (colInfo.sqlType) {
                        ent.Columns.push(colInfo);
                    }
                });
        });
        return entities;
    }
    public async GetIndexesFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        const response = await this.ExecQuery<{
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
                .filter(filterVal => filterVal.TableName === ent.EntityName)
                .forEach(resp => {
                    let indexInfo: IndexInfo = {} as IndexInfo;
                    const indexColumnInfo: IndexColumnInfo = {} as IndexColumnInfo;
                    if (
                        ent.Indexes.filter(
                            filterVal => filterVal.name === resp.IndexName
                        ).length > 0
                    ) {
                        indexInfo = ent.Indexes.find(
                            filterVal => filterVal.name === resp.IndexName
                        )!;
                    } else {
                        indexInfo.columns = [] as IndexColumnInfo[];
                        indexInfo.name = resp.IndexName;
                        indexInfo.isUnique = resp.is_unique === 1;
                        indexInfo.isPrimaryKey = resp.is_primary_key === 1;
                        ent.Indexes.push(indexInfo);
                    }
                    indexColumnInfo.name = resp.ColumnName;
                    indexInfo.columns.push(indexColumnInfo);
                });
        });

        return entities;
    }
    public async GetRelations(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        const response = await this.ExecQuery<{
            TableWithForeignKey: string;
            FK_PartNo: number;
            ForeignKeyColumn: string;
            TableReferenced: string;
            ForeignKeyColumnReferenced: string;
            onDelete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO_ACTION";
            onUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | "NO_ACTION";
            object_id: string;
        }>(`SELECT DISTINCT
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
        const relationsTemp: IRelationTempInfo[] = [] as IRelationTempInfo[];
        response.forEach(resp => {
            let rels = relationsTemp.find(
                val => val.object_id === resp.object_id
            );
            if (rels === undefined) {
                rels = {} as IRelationTempInfo;
                rels.ownerColumnsNames = [];
                rels.referencedColumnsNames = [];
                rels.actionOnDelete =
                    resp.onDelete === "NO_ACTION" ? null : resp.onDelete;
                rels.actionOnUpdate =
                    resp.onUpdate === "NO_ACTION" ? null : resp.onUpdate;
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
    public async DisconnectFromServer() {
        const promise = new Promise<boolean>((resolve, reject) => {
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
        if (this.Connection) {
            await promise;
        }
    }
    public async ConnectToServer(
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
                database,
                host: server,
                password,
                port,
                ssl: {
                    rejectUnauthorized: false
                },
                user
            };
        } else {
            config = {
                database,
                host: server,
                password,
                port,
                user
            };
        }

        const promise = new Promise<boolean>((resolve, reject) => {
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
    public async CreateDB(dbName: string) {
        await this.ExecQuery<any>(`CREATE DATABASE ${dbName}; `);
    }
    public async UseDB(dbName: string) {
        await this.ExecQuery<any>(`USE ${dbName}; `);
    }
    public async DropDB(dbName: string) {
        await this.ExecQuery<any>(`DROP DATABASE ${dbName}; `);
    }
    public async CheckIfDBExists(dbName: string): Promise<boolean> {
        const resp = await this.ExecQuery<any>(
            `SHOW DATABASES LIKE '${dbName}' `
        );
        return resp.length > 0;
    }
    public async ExecQuery<T>(sql: string): Promise<T[]> {
        const ret: T[] = [];
        const query = this.Connection.query(sql);
        const stream = query.stream({});
        const promise = new Promise<boolean>((resolve, reject) => {
            stream.on("data", chunk => {
                ret.push((chunk as any) as T);
            });
            stream.on("error", err => reject(err));
            stream.on("end", () => resolve(true));
        });
        await promise;
        return ret;
    }
}
