import { AbstractDriver } from './AbstractDriver'
import * as MYSQL from 'mysql'
import { ColumnInfo } from './../models/ColumnInfo'
import { EntityInfo } from './../models/EntityInfo'
import { RelationInfo } from './../models/RelationInfo'
import { DatabaseModel } from './../models/DatabaseModel'
/**
 * MysqlDriver
 */
export class MysqlDriver extends AbstractDriver {
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

    async GetAllTables(): Promise<EntityInfo[]> {

        let response = await this.ExecQuery<{ TABLE_SCHEMA: string, TABLE_NAME: string }>(`SELECT TABLE_SCHEMA, TABLE_NAME
            FROM information_schema.tables
            WHERE table_type='BASE TABLE'
            AND table_schema like DATABASE()`);
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
        let response = await this.ExecQuery<{
            TABLE_NAME: string, COLUMN_NAME: string, COLUMN_DEFAULT: string,
            IS_NULLABLE: string, DATA_TYPE: string, CHARACTER_MAXIMUM_LENGTH: number,
            NUMERIC_PRECISION: number, NUMERIC_SCALE: number, IsIdentity: number
        }>(`SELECT TABLE_NAME,COLUMN_NAME,COLUMN_DEFAULT,IS_NULLABLE,
            DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE,
            CASE WHEN EXTRA like '%auto_increment%' THEN 1 ELSE 0 END IsIdentity  FROM INFORMATION_SCHEMA.COLUMNS
             where TABLE_SCHEMA like DATABASE()`);
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
                        colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                        break;
                    case "tinyint":
                        if (resp.NUMERIC_PRECISION == 3) {
                            colInfo.ts_type = "boolean"
                            colInfo.sql_type = "boolean"
                        } else {
                            colInfo.ts_type = "number"
                            colInfo.sql_type = "smallint"
                        colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                    }
                        break;
                    case "smallint":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "smallint"
                        colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                        break;
                    case "bit":
                        colInfo.ts_type = "boolean"
                        colInfo.sql_type = "boolean"
                        break;
                    case "float":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "float"
                        colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                        break;
                    case "bigint":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "bigint"
                        colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                        break;
                    case "date":
                        colInfo.ts_type = "Date"
                        colInfo.sql_type = "date"
                        break;
                    case "time":
                        colInfo.ts_type = "Date"
                        colInfo.sql_type = "time"
                        break;
                    case "datetime":
                        colInfo.ts_type = "Date";
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
                        colInfo.sql_type = "varchar"
                        colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                        break;
                    case "nvarchar":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "nvarchar"
                        colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                        break;
                    case "money":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "decimal"
                        break;
                    case "real":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "double"
                        colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                        break;
                    case "double":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "double"
                        colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                        break;
                    case "decimal":
                        colInfo.ts_type = "number"
                        colInfo.sql_type = "decimal"
                        colInfo.numericPrecision = resp.NUMERIC_PRECISION
                        colInfo.numericScale = resp.NUMERIC_SCALE
                        colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH > 0 ? resp.CHARACTER_MAXIMUM_LENGTH : null;
                        break;
                    case "xml":
                        colInfo.ts_type = "string"
                        colInfo.sql_type = "text"
                        break;
                    default:
                        console.error("Unknown column type:" + resp.DATA_TYPE);
                        break;
                }
                if (colInfo.sql_type) ent.Columns.push(colInfo);
            })
        })
        return entities;
    }
    async GetIndexesFromEntity(entities: EntityInfo[]): Promise<EntityInfo[]> {
        let response = await this.ExecQuery<{
            TableName: string, IndexName: string, ColumnName: string, is_unique: number,
            is_primary_key: number//, is_descending_key: number//, is_included_column: number
        }>(`SELECT TABLE_NAME TableName,INDEX_NAME IndexName,COLUMN_NAME ColumnName,CASE WHEN NON_UNIQUE=0 THEN 1 ELSE 0 END is_unique, 
            CASE WHEN INDEX_NAME='PRIMARY' THEN 1 ELSE 0 END is_primary_key
            FROM information_schema.statistics sta
            WHERE table_schema like DATABASE();
            `);
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
                //  indexColumnInfo.isIncludedColumn = resp.is_included_column == 1 ? true : false;
                //  indexColumnInfo.isDescending = resp.is_descending_key == 1 ? true : false;
                indexInfo.columns.push(indexColumnInfo);

            })
        })

        return entities;
    }
    async GetRelations(entities: EntityInfo[]): Promise<EntityInfo[]> {
        let response = await this.ExecQuery<{
            TableWithForeignKey: string, FK_PartNo: number, ForeignKeyColumn: string,
            TableReferenced: string, ForeignKeyColumnReferenced: string,
            onDelete: "RESTRICT" | "CASCADE" | "SET NULL",
            onUpdate: "RESTRICT" | "CASCADE" | "SET NULL", object_id: string
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
                        return col.name == ownerColumn!.name
                    })
                }
            )
            if (!index) {
                isOneToMany = true;
            } else {
                isOneToMany = false;
            }
            let ownerRelation = new RelationInfo()
            ownerRelation.actionOnDelete = relationTmp.actionOnDelete
            ownerRelation.actionOnUpdate = relationTmp.actionOnUpdate
            ownerRelation.isOwner = true
            ownerRelation.relatedColumn = relatedColumn.name.toLowerCase()
            ownerRelation.relatedTable = relationTmp.referencedTable
            ownerRelation.ownerTable = relationTmp.ownerTable
            ownerRelation.ownerColumn = ownerEntity.EntityName.toLowerCase() + (isOneToMany ? 's' : '')
            ownerRelation.relationType = isOneToMany ? "ManyToOne" : "OneToOne"
            ownerColumn.relations.push(ownerRelation)
            if (isOneToMany) {
                let col = new ColumnInfo()
                col.name = ownerEntity.EntityName.toLowerCase() + 's'
                let referencedRelation = new RelationInfo();
                col.relations.push(referencedRelation)
                referencedRelation.actionOnDelete = relationTmp.actionOnDelete
                referencedRelation.actionOnUpdate = relationTmp.actionOnUpdate
                referencedRelation.isOwner = false
                referencedRelation.relatedColumn = ownerColumn.name
                referencedRelation.relatedTable = relationTmp.ownerTable
                referencedRelation.ownerTable = relationTmp.referencedTable
                referencedRelation.ownerColumn = relatedColumn.name.toLowerCase()
                referencedRelation.relationType = "OneToMany"
                referencedEntity.Columns.push(col)
            } else {
                let col = new ColumnInfo()
                col.name = ownerEntity.EntityName.toLowerCase()
                let referencedRelation = new RelationInfo();
                col.relations.push(referencedRelation)
                referencedRelation.actionOnDelete = relationTmp.actionOnDelete
                referencedRelation.actionOnUpdate = relationTmp.actionOnUpdate
                referencedRelation.isOwner = false
                referencedRelation.relatedColumn = ownerColumn.name
                referencedRelation.relatedTable = relationTmp.ownerTable
                referencedRelation.ownerTable = relationTmp.referencedTable
                referencedRelation.ownerColumn = relatedColumn.name.toLowerCase()
                referencedRelation.relationType = "OneToOne"

                referencedEntity.Columns.push(col)
            }
        })
        return entities;
    }
    async DisconnectFromServer() {
        let promise = new Promise<boolean>(
            (resolve, reject) => {
                this.Connection.end((err) => {
                    if (!err) {
                        //Connection successfull
                        resolve(true)
                    }
                    else {
                        console.error('Error disconnecting to MYSQL Server.')
                        console.error(err.message)
                        process.abort()
                        reject(err)
                    }
                });
            }
        )

        if (this.Connection)
            await promise;

    }

    private Connection: MYSQL.IConnection;
    async ConnectToServer(database: string, server: string, port: number, user: string, password: string) {
        let config: MYSQL.IConnectionConfig = {
            database: database,
            host: server,
            port: port,
            user: user,
            password: password,
        }


        let promise = new Promise<boolean>(
            (resolve, reject) => {
                this.Connection = MYSQL.createConnection(config)

                this.Connection.connect((err) => {
                    if (!err) {
                        //Connection successfull
                        resolve(true)
                    }
                    else {
                        console.error('Error connecting to MYSQL Server.')
                        console.error(err.message)
                        process.abort()
                        reject(err)
                    }
                });
            }
        )

        await promise;
    }
    async CreateDB(dbName: string) {
        let resp = await this.ExecQuery<any>(`CREATE DATABASE ${dbName}; `)
    }
    async UseDB(dbName: string) {
        let resp = await this.ExecQuery<any>(`USE ${dbName}; `)
    }
    async DropDB(dbName: string) {
        let resp = await this.ExecQuery<any>(`DROP DATABASE ${dbName}; `)
    }
    async CheckIfDBExists(dbName: string): Promise<boolean> {
        let resp = await this.ExecQuery<any>(`SHOW DATABASES LIKE '${dbName}' `)
        return resp.length > 0;
    }
    async ExecQuery<T>(sql: string): Promise<Array<T>> {
        let ret: Array<T> = [];
        let that = this;
        let query = this.Connection.query(sql)
        let stream = query.stream({});
        let promise = new Promise<boolean>(
            (resolve, reject) => {
                stream.on('data',
                    chunk => {
                        ret.push(<T><any>chunk)
                    });
                stream.on('end', () => resolve(true));
            })
        await promise;
        return ret;
    }
}