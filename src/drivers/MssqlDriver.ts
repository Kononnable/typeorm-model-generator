import { AbstractDriver } from './AbstractDriver'
import * as MSSQL from 'mssql'
import { ColumnInfo } from './../models/ColumnInfo'
import { EntityInfo } from './../models/EntityInfo'
import { RelationInfo } from './../models/RelationInfo'
import { DatabaseModel } from './../models/DatabaseModel'
/**
 * MssqlDriver
 */
export class MssqlDriver extends AbstractDriver {
    FindPrimaryColumnsFromIndexes(dbModel: DatabaseModel) {
        dbModel.entities.forEach(entity => {
            let primaryIndex = entity.Indexes.find(v => v.isPrimaryKey);
            if (!primaryIndex) {
                console.error(`Table ${entity.EntityName} has no PK.`)
                return;
            }
            let pIndex = primaryIndex //typescript error? pIndex:IndexInfo; primaryIndex:IndexInfo|undefined
            entity.Columns.forEach(col => {
                if (pIndex.columns.some(cIndex => cIndex.name == col.name)) col.isPrimary = true
            })
        });
    }

    async GetAllTables(): Promise<EntityInfo[]> {
        let request = new MSSQL.Request(this.Connection)
        let response: { TABLE_SCHEMA: string, TABLE_NAME: string }[]
            = await request.query("SELECT TABLE_SCHEMA,TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'");
        let ret: EntityInfo[] = <EntityInfo[]>[];
        response.forEach((val) => {
            let ent: EntityInfo = new EntityInfo();
            ent.EntityName = val.TABLE_NAME;
            ent.Columns = <ColumnInfo[]>[];
            ent.Indexes = <IndexInfo[]>[];
            ret.push(ent);
        })
        return ret;
    }
    async GetCoulmnsFromEntity(entities: EntityInfo[]): Promise<EntityInfo[]> {
        let request = new MSSQL.Request(this.Connection)
        let response: {
            TABLE_NAME: string, COLUMN_NAME: string, COLUMN_DEFAULT: string,
            IS_NULLABLE: string, DATA_TYPE: string, CHARACTER_MAXIMUM_LENGTH: number,
            NUMERIC_PRECISION: number, NUMERIC_SCALE: number, IsIdentity: number
        }[]
            = await request.query(`SELECT TABLE_NAME,COLUMN_NAME,COLUMN_DEFAULT,IS_NULLABLE,
   DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE,
   COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') IsIdentity  FROM INFORMATION_SCHEMA.COLUMNS`);
        entities.forEach((ent) => {
            response.filter((filterVal) => {
                return filterVal.TABLE_NAME == ent.EntityName;
            }).forEach((resp) => {
                let colInfo: ColumnInfo = new ColumnInfo();
                colInfo.name = resp.COLUMN_NAME;
                colInfo.is_nullable = resp.IS_NULLABLE == 'YES' ? true : false;
                colInfo.is_generated = resp.IsIdentity == 1 ? true : false;
                colInfo.default = resp.COLUMN_DEFAULT;
                switch (resp.DATA_TYPE) {
                    case "int":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "int"
                        break;
                    case "tinyint":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "smallint"
                        break;
                    case "smallint":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "smallint"
                        break;
                    case "bit":
                        colInfo.ts_type = "boolean"
                        colInfo.sql_type = "boolean"
                        break;
                    case "float":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "float"
                        break;
                    case "date":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "date"
                        break;
                    case "datetime":
                        colInfo.ts_type = "number";
                        colInfo.sql_type = "datetime"
                        break;
                    case "char":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "text"
                        break;
                    case "nchar":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "text"
                        break;
                    case "text":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "text"
                        break;
                    case "ntext":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "text"
                        break;
                    case "varchar":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "string"
                        break;
                    case "nvarchar":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "string"
                        break;
                    case "money":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "decimal"
                        break;
                    case "real":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "double"
                        break;
                    case "decimal":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "decimal"
                        colInfo.numericPrecision = resp.NUMERIC_PRECISION
                        colInfo.numericScale = resp.NUMERIC_SCALE
                        break;
                    case "xml":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "text"
                        break;
                    default:
                        console.error("Unknown column type:" + resp.DATA_TYPE);
                        break;
                }
                colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                if (colInfo.sql_type) ent.Columns.push(colInfo);
            })
        })
        return entities;
    }
    async GetIndexesFromEntity(entities: EntityInfo[]): Promise<EntityInfo[]> {
        let request = new MSSQL.Request(this.Connection)
        let response: {
            TableName: string, IndexName: string, ColumnName: string, is_unique: number,
            is_primary_key: number, is_descending_key: number, is_included_column: number
        }[]
            = await request.query(`SELECT 
     TableName = t.name,
     IndexName = ind.name,
     ColumnName = col.name,
     ind.is_unique,
     ind.is_primary_key,
     ic.is_descending_key,
     ic.is_included_column
FROM 
     sys.indexes ind 
INNER JOIN 
     sys.index_columns ic ON  ind.object_id = ic.object_id and ind.index_id = ic.index_id 
INNER JOIN 
     sys.columns col ON ic.object_id = col.object_id and ic.column_id = col.column_id 
INNER JOIN 
     sys.tables t ON ind.object_id = t.object_id 
WHERE 
     t.is_ms_shipped = 0 
ORDER BY 
     t.name, ind.name, ind.index_id, ic.key_ordinal;`);
        entities.forEach((ent) => {
            response.filter((filterVal) => {
                return filterVal.TableName == ent.EntityName;
            }).forEach((resp) => {
                let indexInfo: IndexInfo = <IndexInfo>{};
                let indexColumnInfo: IndexColumnInfo = <IndexColumnInfo>{};
                if (ent.Indexes.filter((filterVal) => {
                    return filterVal.name == resp.IndexName
                }).length > 0) {
                    indexInfo = ent.Indexes.filter((filterVal) => {
                        return filterVal.name == resp.IndexName
                    })[0];
                } else {
                    indexInfo.columns = <IndexColumnInfo[]>[];
                    indexInfo.name = resp.IndexName;
                    indexInfo.isUnique = resp.is_unique == 1 ? true : false;
                    indexInfo.isPrimaryKey = resp.is_primary_key == 1 ? true : false;
                    ent.Indexes.push(indexInfo);
                }
                indexColumnInfo.name = resp.ColumnName;
                indexColumnInfo.isIncludedColumn = resp.is_included_column == 1 ? true : false;
                indexColumnInfo.isDescending = resp.is_descending_key == 1 ? true : false;
                indexInfo.columns.push(indexColumnInfo);

            })
        })
        return entities;
    }
    async GetRelations(entities: EntityInfo[]): Promise<EntityInfo[]> {
        let request = new MSSQL.Request(this.Connection)
        let response: {
            TableWithForeignKey: string, FK_PartNo: number, ForeignKeyColumn: string,
            TableReferenced: string, ForeignKeyColumnReferenced: string,
            onDelete: "RESTRICT" | "CASCADE" | "SET NULL",
            onUpdate: "RESTRICT" | "CASCADE" | "SET NULL", object_id: number
        }[]
            = await request.query(`select 
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
where 
    fk.is_disabled=0 and fk.is_ms_shipped=0
order by 
    TableWithForeignKey, FK_PartNo`);
        let relationsTemp: RelationTempInfo[] = <RelationTempInfo[]>[];
        response.forEach((resp) => {
            let rels = relationsTemp.find((val) => {
                return val.object_id == resp.object_id;
            })
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
        })
        relationsTemp.forEach((relationTmp) => {
            let ownerEntity = entities.find((entitity) => {
                return entitity.EntityName == relationTmp.ownerTable;
            })
            if (!ownerEntity) {
                console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity model ${relationTmp.ownerTable}.`)
                return;
            }
            let referencedEntity = entities.find((entitity) => {
                return entitity.EntityName == relationTmp.referencedTable;
            })
            if (!referencedEntity) {
                console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity model ${relationTmp.referencedTable}.`)
                return;
            }
            let ownerColumn = ownerEntity.Columns.find((column) => {
                return column.name == relationTmp.ownerColumnsNames[0];
            })
            if (!ownerColumn) {
                console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity column ${relationTmp.ownerTable}.${ownerColumn}.`)
                return;
            }
            let relatedColumn = referencedEntity.Columns.find((column) => {
                return column.name == relationTmp.referencedColumnsNames[0];
            })
            if (!relatedColumn) {
                console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity column ${relationTmp.referencedTable}.${relatedColumn}.`)
                return;
            }
            let ownColumn: ColumnInfo = ownerColumn;
            let isOneToMany: boolean;
            isOneToMany = false;
            let index = ownerEntity.Indexes.find(
                (index) => {
                    return index.isUnique && index.columns.some(col => {
                        return col.name == ownColumn.name
                    })
                }
            )
            if (!index) {
                isOneToMany = true;
            } else {
                isOneToMany = false;
            }
            let ownerRelation=new RelationInfo()
                ownerRelation.actionOnDelete= relationTmp.actionOnDelete
                ownerRelation.actionOnUpdate= relationTmp.actionOnUpdate
                ownerRelation.isOwner= true
                ownerRelation.relatedColumn= relatedColumn.name.toLowerCase()
                ownerRelation.relatedTable= relationTmp.referencedTable
                ownerRelation.relationType= isOneToMany ? "OneToMany" : "OneToOne"
            ownerColumn.relations.push(ownerRelation)
            if (isOneToMany) {
                let col = new ColumnInfo()
                col.name = ownerEntity.EntityName.toLowerCase() //+ 's'
                let referencedRelation = new RelationInfo();
                col.relations.push(referencedRelation)
                    referencedRelation.actionOnDelete= relationTmp.actionOnDelete
                    referencedRelation.actionOnUpdate= relationTmp.actionOnUpdate
                    referencedRelation.isOwner= false
                    referencedRelation.relatedColumn= ownerColumn.name
                    referencedRelation.relatedTable= relationTmp.ownerTable
                    referencedRelation.relationType= "ManyToOne"
                referencedEntity.Columns.push(col)
            } else {
                let col = new ColumnInfo()
                col.name = ownerEntity.EntityName.toLowerCase()
                let referencedRelation = new RelationInfo();
                col.relations.push(referencedRelation)
                    referencedRelation.actionOnDelete= relationTmp.actionOnDelete
                    referencedRelation.actionOnUpdate= relationTmp.actionOnUpdate
                    referencedRelation.isOwner= false
                    referencedRelation.relatedColumn= ownerColumn.name
                    referencedRelation.relatedTable= relationTmp.ownerTable
                    referencedRelation.relationType= "OneToOne"
                
                referencedEntity.Columns.push(col)
            }
        })
        return entities;
    }
    async DisconnectFromServer() {
        if (this.Connection)
            await this.Connection.close();
    }

    private Connection: MSSQL.Connection;
    async ConnectToServer(database: string, server: string, port: number, user: string, password: string) {
        let config: MSSQL.config = {
            database: database,
            server: server,
            port: port,
            user: user,
            password: password,
            options: {
                encrypt: true, // Use this if you're on Windows Azure
                appName: 'typeorm-model-generator'
            }
        }


        let promise = new Promise<boolean>(
            (resolve, reject) => {
                this.Connection = new MSSQL.Connection(config, (err) => {
                    if (!err) {
                        //Connection successfull
                        resolve(true)
                    }
                    else {
                        console.error('Error connecting to MSSQL Server.')
                        console.error(err.message)
                        process.abort()
                        reject(err)
                    }
                });
            }
        )

        await promise;
    }
}