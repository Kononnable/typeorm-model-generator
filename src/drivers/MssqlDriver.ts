import * as MSSQL from 'mssql';
import {AbstractDriver} from './AbstractDriver';
import {ColumnInfo} from './../models/ColumnInfo';
import {EntityInfo} from './../models/EntityInfo';
import {RelationInfo} from './../models/RelationInfo';
import {DatabaseModel} from './../models/DatabaseModel';
import * as TomgUtils from './../Utils';

export class MssqlDriver extends AbstractDriver {
    async GetAllTables(schema: string): Promise<EntityInfo[]> {
        let request = new MSSQL.Request(this.Connection);
        let response: {
            TABLE_SCHEMA: string;
            TABLE_NAME: string;
        }[] = (await request.query(
            `SELECT TABLE_SCHEMA,TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' and TABLE_SCHEMA in (${schema})`
        )).recordset;
        let ret: EntityInfo[] = <EntityInfo[]>[];
        response.forEach(val => {
            let ent: EntityInfo = new EntityInfo();
            ent.EntityName = val.TABLE_NAME;
            ent.Schema = val.TABLE_SCHEMA;
            ent.Columns = <ColumnInfo[]>[];
            ent.Indexes = <IndexInfo[]>[];
            ret.push(ent);
        });
        return ret;
    }

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
        }[] = (await request.query(`SELECT TABLE_NAME,COLUMN_NAME,COLUMN_DEFAULT,IS_NULLABLE,
   DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE,
   COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') IsIdentity  FROM INFORMATION_SCHEMA.COLUMNS  where TABLE_SCHEMA in (${schema})`))
            .recordset;
        entities.forEach(ent => {
            response
                .filter(filterVal => {
                    return filterVal.TABLE_NAME == ent.EntityName;
                })
                .forEach(resp => {
                    let colInfo: ColumnInfo = new ColumnInfo();
                    colInfo.name = resp.COLUMN_NAME;
                    colInfo.isNullable =
                        resp.IS_NULLABLE == "YES" ? true : false;
                    colInfo.isGenerated = resp.IsIdentity == 1 ? true : false;
                    colInfo.columnType = colInfo.isGenerated
                        ? "PrimaryGeneratedColumn"
                        : "Column";
                    colInfo.default = resp.COLUMN_DEFAULT;
                    colInfo.sqlType = resp.DATA_TYPE;
                    colInfo.isDefaultType = false;
                    switch (resp.DATA_TYPE) {
                        case "int":
                            colInfo.isDefaultType = true;
                            colInfo.tsType = "number";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "tinyint":
                            colInfo.tsType = "number";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "smallint":
                            colInfo.tsType = "number";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "bit":
                            colInfo.tsType = "boolean";
                            break;
                        case "float":
                            colInfo.tsType = "number";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            colInfo.numericPrecision = resp.NUMERIC_PRECISION;
                            break;
                        case "bigint":
                            colInfo.tsType = "string";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "date":
                            colInfo.tsType = "Date";
                            break;
                        case "time":
                            colInfo.tsType = "Date";
                            break;
                        case "datetime":
                            colInfo.tsType = "Date";
                            break;
                        case "timestamp":
                            colInfo.tsType = "Date";
                            break;
                        case "char":
                            colInfo.tsType = "string";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "nchar":
                            colInfo.tsType = "string";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "text":
                            colInfo.tsType = "string";
                            break;
                        case "ntext":
                            colInfo.tsType = "string";
                            break;
                        case "uniqueidentifier":
                            colInfo.tsType = "string";
                            break;
                        case "varchar":
                            colInfo.isDefaultType = true;
                            colInfo.tsType = "string";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "binary":
                            colInfo.tsType = "Buffer";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "varbinary":
                            colInfo.tsType = "Buffer";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "image":
                            colInfo.tsType = "Buffer";
                            break;
                        case "nvarchar":
                            colInfo.tsType = "string";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "money":
                            colInfo.tsType = "number";
                            break;
                        case "smallmoney":
                            colInfo.tsType = "number";
                            break;
                        case "real":
                            colInfo.tsType = "number";
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "decimal":
                            colInfo.tsType = "number";
                            colInfo.numericPrecision = resp.NUMERIC_PRECISION;
                            colInfo.numericScale = resp.NUMERIC_SCALE;
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "numeric":
                            colInfo.tsType = "number";
                            colInfo.numericPrecision = resp.NUMERIC_PRECISION;
                            colInfo.numericScale = resp.NUMERIC_SCALE;
                            colInfo.charMaxLength =
                                resp.CHARACTER_MAXIMUM_LENGTH > 0
                                    ? resp.CHARACTER_MAXIMUM_LENGTH
                                    : null;
                            break;
                        case "datetime2":
                            colInfo.tsType = "Date";
                            colInfo.numericPrecision = resp.NUMERIC_PRECISION;
                            break;
                        case "time":
                            colInfo.tsType = "Date";
                            colInfo.numericPrecision = resp.NUMERIC_PRECISION;
                            break;
                        case "datetimeoffset":
                            colInfo.tsType = "Date";
                            colInfo.numericPrecision = resp.NUMERIC_PRECISION;
                            break;
                        case "smalldatetime":
                            colInfo.tsType = "Date";
                            break;
                        case "xml":
                            colInfo.tsType = "string";
                            break;
                        default:
                            TomgUtils.LogFatalError(
                                `Unknown column type: ${
                                    resp.DATA_TYPE
                                }  table name: ${
                                    resp.TABLE_NAME
                                } column name: ${resp.COLUMN_NAME}`
                            );
                            break;
                    }

                    if (colInfo.sqlType) ent.Columns.push(colInfo);
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
            is_primary_key: number; //, is_descending_key: number//, is_included_column: number
        }[] = (await request.query(`SELECT
     TableName = t.name,
     IndexName = ind.name,
     ColumnName = col.name,
     ind.is_unique,
     ind.is_primary_key
    -- ,ic.is_descending_key,
    -- ic.is_included_column
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
                        indexInfo.isUnique = resp.is_unique == 1 ? true : false;
                        indexInfo.isPrimaryKey =
                            resp.is_primary_key == 1 ? true : false;
                        ent.Indexes.push(indexInfo);
                    }
                    indexColumnInfo.name = resp.ColumnName;
                    //  indexColumnInfo.isIncludedColumn = resp.is_included_column == 1 ? true : false;
                    //  indexColumnInfo.isDescending = resp.is_descending_key == 1 ? true : false;
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
            onDelete: "RESTRICT" | "CASCADE" | "SET NULL";
            onUpdate: "RESTRICT" | "CASCADE" | "SET NULL";
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
                rels.actionOnDelete = resp.onDelete;
                rels.actionOnUpdate = resp.onUpdate;
                rels.object_id = resp.object_id;
                rels.ownerTable = resp.TableWithForeignKey;
                rels.referencedTable = resp.TableReferenced;
                relationsTemp.push(rels);
            }
            rels.ownerColumnsNames.push(resp.ForeignKeyColumn);
            rels.referencedColumnsNames.push(resp.ForeignKeyColumnReferenced);
        });
        relationsTemp.forEach(relationTmp => {
            let ownerEntity = entities.find(entitity => {
                return entitity.EntityName == relationTmp.ownerTable;
            });
            if (!ownerEntity) {
                TomgUtils.LogFatalError(
                    `Relation between tables ${relationTmp.ownerTable} and ${
                        relationTmp.referencedTable
                    } didn't found entity model ${relationTmp.ownerTable}.`
                );
                return;
            }
            let referencedEntity = entities.find(entitity => {
                return entitity.EntityName == relationTmp.referencedTable;
            });
            if (!referencedEntity) {
                TomgUtils.LogFatalError(
                    `Relation between tables ${relationTmp.ownerTable} and ${
                        relationTmp.referencedTable
                    } didn't found entity model ${relationTmp.referencedTable}.`
                );
                return;
            }
            let ownerColumn = ownerEntity.Columns.find(column => {
                return column.name == relationTmp.ownerColumnsNames[0];
            });
            if (!ownerColumn) {
                TomgUtils.LogFatalError(
                    `Relation between tables ${relationTmp.ownerTable} and ${
                        relationTmp.referencedTable
                    } didn't found entity column ${
                        relationTmp.ownerTable
                    }.${ownerColumn}.`
                );
                return;
            }
            let relatedColumn = referencedEntity.Columns.find(column => {
                return column.name == relationTmp.referencedColumnsNames[0];
            });
            if (!relatedColumn) {
                TomgUtils.LogFatalError(
                    `Relation between tables ${relationTmp.ownerTable} and ${
                        relationTmp.referencedTable
                    } didn't found entity column ${
                        relationTmp.referencedTable
                    }.${relatedColumn}.`
                );
                return;
            }
            let ownColumn: ColumnInfo = ownerColumn;
            let isOneToMany: boolean;
            isOneToMany = false;
            let index = ownerEntity.Indexes.find(index => {
                return (
                    index.isUnique &&
                    index.columns.some(col => {
                        return col.name == ownerColumn!.name;
                    })
                );
            });
            if (!index) {
                isOneToMany = true;
            } else {
                isOneToMany = false;
            }
            let ownerRelation = new RelationInfo();
            let columnName =
                ownerEntity.EntityName.toLowerCase() /* + (isOneToMany ? "s" : "")*/;
            if (
                referencedEntity.Columns.filter(filterVal => {
                    return filterVal.name == columnName;
                }).length > 0
            ) {
                for (let i = 2; i <= ownerEntity.Columns.length; i++) {
                    columnName =
                        ownerEntity.EntityName.toLowerCase() +
                        /*(isOneToMany ? "s" : "")*/ +
                        i.toString();
                    if (
                        referencedEntity.Columns.filter(filterVal => {
                            return filterVal.name == columnName;
                        }).length == 0
                    )
                        break;
                }
            }
            ownerRelation.actionOnDelete = relationTmp.actionOnDelete;
            ownerRelation.actionOnUpdate = relationTmp.actionOnUpdate;
            ownerRelation.isOwner = true;
            ownerRelation.relatedColumn = relatedColumn.name.toLowerCase();
            ownerRelation.relatedTable = relationTmp.referencedTable;
            ownerRelation.ownerTable = relationTmp.ownerTable;
            ownerRelation.ownerColumn = columnName;
            ownerRelation.relationType = isOneToMany ? "ManyToOne" : "OneToOne";
            ownerColumn.relations.push(ownerRelation);
            if (isOneToMany) {
                let col = new ColumnInfo();
                col.name = columnName;
                let referencedRelation = new RelationInfo();
                col.relations.push(referencedRelation);
                referencedRelation.actionOnDelete = relationTmp.actionOnDelete;
                referencedRelation.actionOnUpdate = relationTmp.actionOnUpdate;
                referencedRelation.isOwner = false;
                referencedRelation.relatedColumn = ownerColumn.name;
                referencedRelation.relatedTable = relationTmp.ownerTable;
                referencedRelation.ownerTable = relationTmp.referencedTable;
                referencedRelation.ownerColumn = relatedColumn.name.toLowerCase();
                referencedRelation.relationType = "OneToMany";
                referencedEntity.Columns.push(col);
            } else {
                let col = new ColumnInfo();
                col.name = columnName;
                let referencedRelation = new RelationInfo();
                col.relations.push(referencedRelation);
                referencedRelation.actionOnDelete = relationTmp.actionOnDelete;
                referencedRelation.actionOnUpdate = relationTmp.actionOnUpdate;
                referencedRelation.isOwner = false;
                referencedRelation.relatedColumn = ownerColumn.name;
                referencedRelation.relatedTable = relationTmp.ownerTable;
                referencedRelation.ownerTable = relationTmp.referencedTable;
                referencedRelation.ownerColumn = relatedColumn.name.toLowerCase();
                referencedRelation.relationType = "OneToOne";

                referencedEntity.Columns.push(col);
            }
        });
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
                encrypt: ssl, // Use this if you're on Windows Azure
                appName: "typeorm-model-generator"
            }
        };

        let promise = new Promise<boolean>((resolve, reject) => {
            this.Connection = new MSSQL.ConnectionPool(config, err => {
                if (!err) {
                    //Connection successfull
                    resolve(true);
                } else {
                    TomgUtils.LogFatalError(
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
        let resp = await request.query(`CREATE DATABASE ${dbName}; `);
    }

    async UseDB(dbName: string) {
        let request = new MSSQL.Request(this.Connection);
        let resp = await request.query(`USE ${dbName}; `);
    }

    async DropDB(dbName: string) {
        let request = new MSSQL.Request(this.Connection);
        let resp = await request.query(`DROP DATABASE ${dbName}; `);
    }

    async CheckIfDBExists(dbName: string): Promise<boolean> {
        let request = new MSSQL.Request(this.Connection);
        let resp = await request.query(
            `SELECT name FROM master.sys.databases WHERE name = N'${dbName}' `
        );
        return resp.recordset.length > 0;
    }
}
