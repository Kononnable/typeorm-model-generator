import { AbstractDriver } from './AbstractDriver'
import * as Oracle from 'oracledb'
import { ColumnInfo } from './../models/ColumnInfo'
import { EntityInfo } from './../models/EntityInfo'
import { RelationInfo } from './../models/RelationInfo'
import { DatabaseModel } from './../models/DatabaseModel'
import {promisify} from 'util'
/**
 * OracleDriver
 */
export class OracleDriver extends AbstractDriver {
    FindPrimaryColumnsFromIndexes(dbModel: DatabaseModel) {
        dbModel.entities.forEach(entity => {
            let primaryIndex = entity.Indexes.find(v => v.isPrimaryKey);
            if (!primaryIndex) {
                console.error(`Table ${entity.EntityName} has no PK.`)
                return;
            }
            entity.Columns.forEach(col => {
                if (primaryIndex!.columns.some(cIndex => cIndex.name == col.name)) col.isPrimary = true
            })
        });
    }
    
    

    
    async GetAllTables(schema: string): Promise<EntityInfo[]> {
        
        let response :any[][] = ( await this.Connection.execute(` SELECT TABLE_NAME FROM all_tables WHERE  owner = (select user from dual)`)).rows!;
        let ret: EntityInfo[] = <EntityInfo[]>[];
        response.forEach((val) => {
            let ent: EntityInfo = new EntityInfo();
            ent.EntityName = val[0];
            ent.Columns = <ColumnInfo[]>[];
            ent.Indexes = <IndexInfo[]>[];
            ret.push(ent);
        })
        return ret;
    }
    async GetCoulmnsFromEntity(entities: EntityInfo[], schema: string): Promise<EntityInfo[]> {
//         let request = new Oracle.Request(this.Connection)
//         let response: {
//             TABLE_NAME: string, COLUMN_NAME: string, COLUMN_DEFAULT: string,
//             IS_NULLABLE: string, DATA_TYPE: string, CHARACTER_MAXIMUM_LENGTH: number,
//             NUMERIC_PRECISION: number, NUMERIC_SCALE: number, IsIdentity: number
//         }[]
//             = (await request.query(`SELECT TABLE_NAME,COLUMN_NAME,COLUMN_DEFAULT,IS_NULLABLE,
//    DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE,
//    COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') IsIdentity  FROM INFORMATION_SCHEMA.COLUMNS  where TABLE_SCHEMA='${schema}'`)).recordset;
//         entities.forEach((ent) => {
//             response.filter((filterVal) => {
//                 return filterVal.TABLE_NAME == ent.EntityName;
//             }).forEach((resp) => {
//                 let colInfo: ColumnInfo = new ColumnInfo();
//                 colInfo.name = resp.COLUMN_NAME;
//                 colInfo.is_nullable = resp.IS_NULLABLE == 'YES' ? true : false;
//                 colInfo.is_generated = resp.IsIdentity == 1 ? true : false;
//                 colInfo.default = resp.COLUMN_DEFAULT;
//                 switch (resp.DATA_TYPE) {
//                     case "int":
//                         colInfo.ts_type = "number"
//                         colInfo.sql_type = "int"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "tinyint":
//                         colInfo.ts_type = "number"
//                         colInfo.sql_type = "smallint"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "smallint":
//                         colInfo.ts_type = "number"
//                         colInfo.sql_type = "smallint"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "bit":
//                         colInfo.ts_type = "boolean"
//                         colInfo.sql_type = "boolean"
//                         break;
//                     case "float":
//                         colInfo.ts_type = "number"
//                         colInfo.sql_type = "float"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         colInfo.numericPrecision = resp.NUMERIC_PRECISION
//                         break;
//                     case "bigint":
//                         colInfo.ts_type = "string"
//                         colInfo.sql_type = "bigint"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "date":
//                         colInfo.ts_type = "Date"
//                         colInfo.sql_type = "date"
//                         break;
//                     case "time":
//                         colInfo.ts_type = "Date"
//                         colInfo.sql_type = "time"
//                         break;
//                     case "datetime":
//                         colInfo.ts_type = "Date";
//                         colInfo.sql_type = "datetime"
//                         break;
//                     case "char":
//                         colInfo.ts_type = "string"
//                         colInfo.sql_type = "char"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "nchar":
//                         colInfo.ts_type = "string"
//                         colInfo.sql_type = "nchar"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "text":
//                         colInfo.ts_type = "string"
//                         colInfo.sql_type = "text"
//                         break;
//                     case "ntext":
//                         colInfo.ts_type = "string"
//                         colInfo.sql_type = "ntext"
//                         break;
//                     case "uniqueidentifier":
//                         colInfo.ts_type = "string"
//                         colInfo.sql_type = "uniqueidentifier"
//                         break;
//                     case "varchar":
//                         colInfo.ts_type = "string"
//                         colInfo.sql_type = "varchar"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "binary":
//                         colInfo.ts_type = "Buffer"
//                         colInfo.sql_type = "binary"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "varbinary":
//                         colInfo.ts_type = "Buffer"
//                         colInfo.sql_type = "varbinary"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "image":
//                         colInfo.ts_type = "Buffer"
//                         colInfo.sql_type = "image"
//                         break;
//                     case "nvarchar":
//                         colInfo.ts_type = "string"
//                         colInfo.sql_type = "nvarchar"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "money":
//                         colInfo.ts_type = "number"
//                         colInfo.sql_type = "decimal"
//                         break;
//                     case "smallmoney":
//                         colInfo.ts_type = "number"
//                         colInfo.sql_type = "smallmoney"
//                         break;
//                     case "real":
//                         colInfo.ts_type = "number"
//                         colInfo.sql_type = "double"
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "decimal":
//                         colInfo.ts_type = "number"
//                         colInfo.sql_type = "decimal"
//                         colInfo.numericPrecision = resp.NUMERIC_PRECISION
//                         colInfo.numericScale = resp.NUMERIC_SCALE
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "numeric":
//                         colInfo.ts_type = "number"
//                         colInfo.sql_type = "numeric"
//                         colInfo.numericPrecision = resp.NUMERIC_PRECISION
//                         colInfo.numericScale = resp.NUMERIC_SCALE
//                         colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
//                         break;
//                     case "datetime2":
//                         colInfo.ts_type = "Date"
//                         colInfo.sql_type = "datetime2"
//                         colInfo.numericPrecision = resp.NUMERIC_PRECISION
//                         break;
//                     case "time":
//                         colInfo.ts_type = "Date"
//                         colInfo.sql_type = "time"
//                         colInfo.numericPrecision = resp.NUMERIC_PRECISION
//                         break;
//                     case "datetimeoffset":
//                         colInfo.ts_type = "Date"
//                         colInfo.sql_type = "datetimeoffset"
//                         colInfo.numericPrecision = resp.NUMERIC_PRECISION
//                         break;
//                     case "smalldatetime":
//                         colInfo.ts_type = "Date"
//                         colInfo.sql_type = "smalldatetime"
//                         break;
//                     case "xml":
//                         colInfo.ts_type = "string"
//                         colInfo.sql_type = "text"
//                         break;
//                     default:
//                         console.error("Unknown column type:" + resp.DATA_TYPE);
//                         break;
//                 }

//                 if (colInfo.sql_type) ent.Columns.push(colInfo);
//             })
//         })
        return entities;
    }
    async GetIndexesFromEntity(entities: EntityInfo[], schema: string): Promise<EntityInfo[]> {
//         let request = new Oracle.Request(this.Connection)
//         let response: {
//             TableName: string, IndexName: string, ColumnName: string, is_unique: number,
//             is_primary_key: number//, is_descending_key: number//, is_included_column: number
//         }[]
//             = (await request.query(`SELECT 
//      TableName = t.name,
//      IndexName = ind.name,
//      ColumnName = col.name,
//      ind.is_unique,
//      ind.is_primary_key
//     -- ,ic.is_descending_key,
//     -- ic.is_included_column
// FROM 
//      sys.indexes ind 
// INNER JOIN 
//      sys.index_columns ic ON  ind.object_id = ic.object_id and ind.index_id = ic.index_id 
// INNER JOIN 
//      sys.columns col ON ic.object_id = col.object_id and ic.column_id = col.column_id 
// INNER JOIN 
//      sys.tables t ON ind.object_id = t.object_id 
// INNER JOIN
//      sys.schemas s on s.schema_id=t.schema_id
// WHERE 
//      t.is_ms_shipped = 0 and s.name='${schema}'
// ORDER BY 
//      t.name, ind.name, ind.index_id, ic.key_ordinal;`)).recordset;
//         entities.forEach((ent) => {
//             response.filter((filterVal) => {
//                 return filterVal.TableName == ent.EntityName;
//             }).forEach((resp) => {
//                 let indexInfo: IndexInfo = <IndexInfo>{};
//                 let indexColumnInfo: IndexColumnInfo = <IndexColumnInfo>{};
//                 if (ent.Indexes.filter((filterVal) => {
//                     return filterVal.name == resp.IndexName
//                 }).length > 0) {
//                     indexInfo = ent.Indexes.filter((filterVal) => {
//                         return filterVal.name == resp.IndexName
//                     })[0];
//                 } else {
//                     indexInfo.columns = <IndexColumnInfo[]>[];
//                     indexInfo.name = resp.IndexName;
//                     indexInfo.isUnique = resp.is_unique == 1 ? true : false;
//                     indexInfo.isPrimaryKey = resp.is_primary_key == 1 ? true : false;
//                     ent.Indexes.push(indexInfo);
//                 }
//                 indexColumnInfo.name = resp.ColumnName;
//                 //  indexColumnInfo.isIncludedColumn = resp.is_included_column == 1 ? true : false;
//                 //  indexColumnInfo.isDescending = resp.is_descending_key == 1 ? true : false;
//                 indexInfo.columns.push(indexColumnInfo);

//             })
//         })

        return entities;
    }
    async GetRelations(entities: EntityInfo[], schema: string): Promise<EntityInfo[]> {
//         let request = new Oracle.Request(this.Connection)
//         let response: {
//             TableWithForeignKey: string, FK_PartNo: number, ForeignKeyColumn: string,
//             TableReferenced: string, ForeignKeyColumnReferenced: string,
//             onDelete: "RESTRICT" | "CASCADE" | "SET NULL",
//             onUpdate: "RESTRICT" | "CASCADE" | "SET NULL", object_id: number
//         }[]
//             = (await request.query(`select 
//     parentTable.name as TableWithForeignKey, 
//     fkc.constraint_column_id as FK_PartNo,
//      parentColumn.name as ForeignKeyColumn,
//      referencedTable.name as TableReferenced, 
//      referencedColumn.name as ForeignKeyColumnReferenced,
//      fk.delete_referential_action_desc as onDelete,
//      fk.update_referential_action_desc as onUpdate,
//      fk.object_id
// from 
//     sys.foreign_keys fk 
// inner join 
//     sys.foreign_key_columns as fkc on fkc.constraint_object_id=fk.object_id
// inner join 
//     sys.tables as parentTable on fkc.parent_object_id = parentTable.object_id
// inner join 
//     sys.columns as parentColumn on fkc.parent_object_id = parentColumn.object_id and fkc.parent_column_id = parentColumn.column_id
// inner join 
//     sys.tables as referencedTable on fkc.referenced_object_id = referencedTable.object_id
// inner join 
//     sys.columns as referencedColumn on fkc.referenced_object_id = referencedColumn.object_id and fkc.referenced_column_id = referencedColumn.column_id
// inner join
// 	sys.schemas as parentSchema on parentSchema.schema_id=parentTable.schema_id
// where 
//     fk.is_disabled=0 and fk.is_ms_shipped=0 and parentSchema.name='${schema}'
// order by 
//     TableWithForeignKey, FK_PartNo`)).recordset;
//         let relationsTemp: RelationTempInfo[] = <RelationTempInfo[]>[];
//         response.forEach((resp) => {
//             let rels = relationsTemp.find((val) => {
//                 return val.object_id == resp.object_id;
//             })
//             if (rels == undefined) {
//                 rels = <RelationTempInfo>{};
//                 rels.ownerColumnsNames = [];
//                 rels.referencedColumnsNames = [];
//                 rels.actionOnDelete = resp.onDelete;
//                 rels.actionOnUpdate = resp.onUpdate;
//                 rels.object_id = resp.object_id;
//                 rels.ownerTable = resp.TableWithForeignKey;
//                 rels.referencedTable = resp.TableReferenced;
//                 relationsTemp.push(rels);
//             }
//             rels.ownerColumnsNames.push(resp.ForeignKeyColumn);
//             rels.referencedColumnsNames.push(resp.ForeignKeyColumnReferenced);
//         })
//         relationsTemp.forEach((relationTmp) => {
//             let ownerEntity = entities.find((entitity) => {
//                 return entitity.EntityName == relationTmp.ownerTable;
//             })
//             if (!ownerEntity) {
//                 console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity model ${relationTmp.ownerTable}.`)
//                 return;
//             }
//             let referencedEntity = entities.find((entitity) => {
//                 return entitity.EntityName == relationTmp.referencedTable;
//             })
//             if (!referencedEntity) {
//                 console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity model ${relationTmp.referencedTable}.`)
//                 return;
//             }
//             let ownerColumn = ownerEntity.Columns.find((column) => {
//                 return column.name == relationTmp.ownerColumnsNames[0];
//             })
//             if (!ownerColumn) {
//                 console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity column ${relationTmp.ownerTable}.${ownerColumn}.`)
//                 return;
//             }
//             let relatedColumn = referencedEntity.Columns.find((column) => {
//                 return column.name == relationTmp.referencedColumnsNames[0];
//             })
//             if (!relatedColumn) {
//                 console.error(`Relation between tables ${relationTmp.ownerTable} and ${relationTmp.referencedTable} didn't found entity column ${relationTmp.referencedTable}.${relatedColumn}.`)
//                 return;
//             }
//             let ownColumn: ColumnInfo = ownerColumn;
//             let isOneToMany: boolean;
//             isOneToMany = false;
//             let index = ownerEntity.Indexes.find(
//                 (index) => {
//                     return index.isUnique && index.columns.some(col => {
//                         return col.name == ownerColumn!.name
//                     })
//                 }
//             )
//             if (!index) {
//                 isOneToMany = true;
//             } else {
//                 isOneToMany = false;
//             }
//             let ownerRelation = new RelationInfo()
//             let columnName = ownerEntity.EntityName.toLowerCase() + (isOneToMany ? 's' : '')
//             if (referencedEntity.Columns.filter((filterVal) => {
//                 return filterVal.name == columnName;
//             }).length > 0) {
//                 for (let i = 2; i <= ownerEntity.Columns.length; i++) {
//                     columnName = ownerEntity.EntityName.toLowerCase() + (isOneToMany ? 's' : '') + i.toString();
//                     if (referencedEntity.Columns.filter((filterVal) => {
//                         return filterVal.name == columnName;
//                     }).length == 0) break;
//                 }
//             }
//             ownerRelation.actionOnDelete = relationTmp.actionOnDelete
//             ownerRelation.actionOnUpdate = relationTmp.actionOnUpdate
//             ownerRelation.isOwner = true
//             ownerRelation.relatedColumn = relatedColumn.name.toLowerCase()
//             ownerRelation.relatedTable = relationTmp.referencedTable
//             ownerRelation.ownerTable = relationTmp.ownerTable
//             ownerRelation.ownerColumn = columnName
//             ownerRelation.relationType = isOneToMany ? "ManyToOne" : "OneToOne"
//             ownerColumn.relations.push(ownerRelation)
//             if (isOneToMany) {
//                 let col = new ColumnInfo()
//                 col.name = columnName
//                 let referencedRelation = new RelationInfo();
//                 col.relations.push(referencedRelation)
//                 referencedRelation.actionOnDelete = relationTmp.actionOnDelete
//                 referencedRelation.actionOnUpdate = relationTmp.actionOnUpdate
//                 referencedRelation.isOwner = false
//                 referencedRelation.relatedColumn = ownerColumn.name
//                 referencedRelation.relatedTable = relationTmp.ownerTable
//                 referencedRelation.ownerTable = relationTmp.referencedTable
//                 referencedRelation.ownerColumn = relatedColumn.name.toLowerCase()
//                 referencedRelation.relationType = "OneToMany"
//                 referencedEntity.Columns.push(col)
//             } else {
//                 let col = new ColumnInfo()
//                 col.name = columnName
//                 let referencedRelation = new RelationInfo();
//                 col.relations.push(referencedRelation)
//                 referencedRelation.actionOnDelete = relationTmp.actionOnDelete
//                 referencedRelation.actionOnUpdate = relationTmp.actionOnUpdate
//                 referencedRelation.isOwner = false
//                 referencedRelation.relatedColumn = ownerColumn.name
//                 referencedRelation.relatedTable = relationTmp.ownerTable
//                 referencedRelation.ownerTable = relationTmp.referencedTable
//                 referencedRelation.ownerColumn = relatedColumn.name.toLowerCase()
//                 referencedRelation.relationType = "OneToOne"

//                 referencedEntity.Columns.push(col)
//             }
//         })
        return entities;
    }
    async DisconnectFromServer() {
        if (this.Connection)
            await this.Connection.close();
    }

    private Connection: Oracle.IConnection;
    async ConnectToServer(database: string, server: string, port: number, user: string, password: string, ssl: boolean) {
        let config: Oracle.IConnectionAttributes = {
            user: user,
            password: password,
            // connectString: `${server}:${port}/ORCLCDB.localdomain/${database}`,
            connectString: `${server}:${port}/${database}`,
             externalAuth: ssl
        }


        let that=this;
        let promise = new Promise<boolean>(
            (resolve, reject) => {
                Oracle.getConnection(
                    config,
                    function (err, connection) {
                        if (!err) {
                            //Connection successfull
                            that.Connection=connection
                            resolve(true)
                        }
                        else {
                            console.error('Error connecting to Oracle Server.')
                            console.error(err.message)
                            process.abort()
                            reject(err)
                        }

                    });
            }
        )

        await promise;
    }
    // connection.execute(
    //     `SELECT department_id, department_name
    //      FROM departments
    //      WHERE manager_id < :id`,
    //     [110],  // bind value for :id
    //     function(err, result)
    //     {
    //       if (err) {
    //         console.error(err.message);
    //         doRelease(connection);
    //         return;
    //       }
    //       console.log(result.rows);
    //       doRelease(connection);
    //     });


    async CreateDB(dbName: string) {
    }
    async UseDB(dbName: string) {
    }
    async DropDB(dbName: string) {
    }
    async CheckIfDBExists(dbName: string): Promise<boolean> {
        return true;
    }
}