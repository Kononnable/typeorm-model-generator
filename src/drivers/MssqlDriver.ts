import { AbstractDriver } from "./AbstractDriver";
import * as MSSQL from "mssql";
import { ColumnInfo } from "../models/ColumnInfo";
import { EntityInfo } from "../models/EntityInfo";
import * as TomgUtils from "../Utils";

export class MssqlDriver extends AbstractDriver {
    GetAllTablesQuery = async (schema: string) => {
        let request = new MSSQL.Request(this.Connection);
        let response: {
            TABLE_SCHEMA: string;
            TABLE_NAME: string;
        }[] = (await request.query(
            `SELECT TABLE_SCHEMA,TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' and TABLE_SCHEMA in (${schema})`
        )).recordset;
        return response;
    };

    async GetCoulmnsFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let request = new MSSQL.Request(this.Connection);
        let response: {
            TABLE_NAME: string;
            COLUMN_NAME: string;
            COLUMN_DEFAULT: string;
            IS_NULLABLE: string;
            DATA_TYPE: string;
            CHARACTER_MAXIMUM_LENGTH: number;
            NUMERIC_PRECISION: number;
            NUMERIC_SCALE: number;
            IsIdentity: number;
            IsUnique: number;
        }[] = (await request.query(`SELECT TABLE_NAME,COLUMN_NAME,COLUMN_DEFAULT,IS_NULLABLE,
   DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE,
   COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') IsIdentity,
   (SELECT count(*)
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        inner join INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cu
            on cu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
    where
        tc.CONSTRAINT_TYPE = 'UNIQUE'
        and tc.TABLE_NAME = c.TABLE_NAME
        and cu.COLUMN_NAME = c.COLUMN_NAME
        and tc.TABLE_SCHEMA=c.TABLE_SCHEMA) IsUnique
   FROM INFORMATION_SCHEMA.COLUMNS c where TABLE_SCHEMA in (${schema})`))
            .recordset;
        entities.forEach(ent => {
            response
                .filter(filterVal => {
                    return filterVal.TABLE_NAME == ent.EntityName;
                })
                .forEach(resp => {
                    let colInfo: ColumnInfo = new ColumnInfo();
                    colInfo.tsName = resp.COLUMN_NAME;
                    colInfo.sqlName = resp.COLUMN_NAME;
                    colInfo.is_nullable = resp.IS_NULLABLE == "YES";
                    colInfo.is_generated = resp.IsIdentity == 1;
                    colInfo.is_unique = resp.IsUnique == 1;
                    colInfo.default = resp.COLUMN_DEFAULT;
                    colInfo.sql_type = resp.DATA_TYPE;
                    switch (resp.DATA_TYPE) {
                        case "bigint":
                            colInfo.ts_type = "string";
                            break;
                        case "bit":
                            colInfo.ts_type = "boolean";
                            break;
                        case "decimal":
                            colInfo.ts_type = "number";
                            break;
                        case "int":
                            colInfo.ts_type = "number";
                            break;
                        case "money":
                            colInfo.ts_type = "number";
                            break;
                        case "numeric":
                            colInfo.ts_type = "number";
                            break;
                        case "smallint":
                            colInfo.ts_type = "number";
                            break;
                        case "smallmoney":
                            colInfo.ts_type = "number";
                            break;
                        case "tinyint":
                            colInfo.ts_type = "number";
                            break;
                        case "float":
                            colInfo.ts_type = "number";
                            break;
                        case "real":
                            colInfo.ts_type = "number";
                            break;
                        case "date":
                            colInfo.ts_type = "Date";
                            break;
                        case "datetime2":
                            colInfo.ts_type = "Date";
                            break;
                        case "datetime":
                            colInfo.ts_type = "Date";
                            break;
                        case "datetimeoffset":
                            colInfo.ts_type = "Date";
                            break;
                        case "smalldatetime":
                            colInfo.ts_type = "Date";
                            break;
                        case "time":
                            colInfo.ts_type = "Date";
                            break;
                        case "char":
                            colInfo.ts_type = "string";
                            break;
                        case "text":
                            colInfo.ts_type = "string";
                            break;
                        case "varchar":
                            colInfo.ts_type = "string";
                            break;
                        case "nchar":
                            colInfo.ts_type = "string";
                            break;
                        case "ntext":
                            colInfo.ts_type = "string";
                            break;
                        case "nvarchar":
                            colInfo.ts_type = "string";
                            break;
                        case "binary":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "image":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "varbinary":
                            colInfo.ts_type = "Buffer";
                            break;
                        case "hierarchyid":
                            colInfo.ts_type = "string";
                            break;
                        case "sql_variant":
                            colInfo.ts_type = "string";
                            break;
                        case "timestamp":
                            colInfo.ts_type = "Date";
                            break;
                        case "uniqueidentifier":
                            colInfo.ts_type = "string";
                            break;
                        case "xml":
                            colInfo.ts_type = "string";
                            break;
                        case "geometry":
                            colInfo.ts_type = "string";
                            break;
                        case "geography":
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

                    if (colInfo.sql_type) ent.Columns.push(colInfo);
                });
        });
        return entities;
    }
    async GetIndexesFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let request = new MSSQL.Request(this.Connection);
        let response: {
            TableName: string;
            IndexName: string;
            ColumnName: string;
            is_unique: number;
            is_primary_key: number;
        }[] = (await request.query(`SELECT
     TableName = t.name,
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
     t.is_ms_shipped = 0 and s.name in (${schema})
ORDER BY
     t.name, ind.name, ind.index_id, ic.key_ordinal;`)).recordset;
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
        let request = new MSSQL.Request(this.Connection);
        let response: {
            TableWithForeignKey: string;
            FK_PartNo: number;
            ForeignKeyColumn: string;
            TableReferenced: string;
            ForeignKeyColumnReferenced: string;
            onDelete: "RESTRICT" | "CASCADE" | "SET_NULL" | "NO_ACTION";
            onUpdate: "RESTRICT" | "CASCADE" | "SET_NULL" | "NO_ACTION";
            object_id: number;
        }[] = (await request.query(`select
    parentTable.name as TableWithForeignKey,
    fkc.constraint_column_id as FK_PartNo,
     parentColumn.name as ForeignKeyColumn,
     referencedTable.name as TableReferenced,
     referencedColumn.name as ForeignKeyColumnReferenced,
     fk.delete_referential_action_desc as onDelete,
     fk.update_referential_action_desc as onUpdate,
     fk.object_id
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
    fk.is_disabled=0 and fk.is_ms_shipped=0 and parentSchema.name in (${schema})
order by
    TableWithForeignKey, FK_PartNo`)).recordset;
        let relationsTemp: RelationTempInfo[] = <RelationTempInfo[]>[];
        response.forEach(resp => {
            let rels = relationsTemp.find(val => {
                return val.object_id == resp.object_id;
            });
            if (rels == undefined) {
                rels = <RelationTempInfo>{};
                rels.ownerColumnsNames = [];
                rels.referencedColumnsNames = [];
                switch (resp.onDelete) {
                    case "NO_ACTION":
                        rels.actionOnDelete = null;
                        break;
                    case "SET_NULL":
                        rels.actionOnDelete = "SET NULL";
                        break;
                    default:
                        rels.actionOnDelete = resp.onDelete;

                        break;
                }
                switch (resp.onUpdate) {
                    case "NO_ACTION":
                        rels.actionOnUpdate = null;
                        break;
                    case "SET_NULL":
                        rels.actionOnUpdate = "SET NULL";
                        break;
                    default:
                        rels.actionOnUpdate = resp.onUpdate;

                        break;
                }
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
        if (this.Connection) await this.Connection.close();
    }

    private Connection: MSSQL.ConnectionPool;
    async ConnectToServer(
        database: string,
        server: string,
        port: number,
        user: string,
        password: string,
        ssl: boolean
    ) {
        let config: MSSQL.config = {
            database: database,
            server: server,
            port: port,
            user: user,
            password: password,
            options: {
                encrypt: ssl,
                appName: "typeorm-model-generator"
            }
        };

        let promise = new Promise<boolean>((resolve, reject) => {
            this.Connection = new MSSQL.ConnectionPool(config, err => {
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
    async CreateDB(dbName: string) {
        let request = new MSSQL.Request(this.Connection);
        await request.query(`CREATE DATABASE ${dbName}; `);
    }
    async UseDB(dbName: string) {
        let request = new MSSQL.Request(this.Connection);
        await request.query(`USE ${dbName}; `);
    }
    async DropDB(dbName: string) {
        let request = new MSSQL.Request(this.Connection);
        await request.query(`DROP DATABASE ${dbName}; `);
    }
    async CheckIfDBExists(dbName: string): Promise<boolean> {
        let request = new MSSQL.Request(this.Connection);
        let resp = await request.query(
            `SELECT name FROM master.sys.databases WHERE name = N'${dbName}' `
        );
        return resp.recordset.length > 0;
    }
}
