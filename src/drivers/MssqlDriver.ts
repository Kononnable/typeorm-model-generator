import { AbstractDriver } from './abstractDriver'
import * as MSSQL from 'mssql'
/**
 * MssqlDriver
 */
export class MssqlDriver extends AbstractDriver {
    async GetAllTables(): Promise<EntityInfo[]> {
        let request = new MSSQL.Request(this.Connection)
        let response: { TABLE_SCHEMA: string, TABLE_NAME: string }[]
            = await request.query("SELECT TABLE_SCHEMA,TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'");
        let ret: EntityInfo[] = <EntityInfo[]>[];
        response.forEach((val) => {
            let ent: EntityInfo = <EntityInfo>{};
            ent.EntityName = val.TABLE_NAME;
            ent.Columns = <ColumnInfo[]>[];
            ent.Indexes = <IndexInfo[]>[];
            ret.push(ent);
        })
        return ret;
    }
    async GetCoulmnsFromEntity(entities: EntityInfo[]) {
        let request = new MSSQL.Request(this.Connection)
        let response: { TABLE_NAME: string, COLUMN_NAME: string, COLUMN_DEFAULT: string, IS_NULLABLE: string, DATA_TYPE: string, CHARACTER_MAXIMUM_LENGTH: number }[]
            = await request.query("SELECT TABLE_NAME,COLUMN_NAME,COLUMN_DEFAULT,IS_NULLABLE,DATA_TYPE,CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS");
        entities.forEach((ent) => {
            response.filter((filterVal) => {
                return filterVal.TABLE_NAME == ent.EntityName;
            }).forEach((resp) => {
                let colInfo: ColumnInfo = <ColumnInfo>{};
                colInfo.name = resp.COLUMN_NAME;
                colInfo.is_nullable = resp.IS_NULLABLE == 'YES' ? true : false;
                colInfo.default = resp.COLUMN_DEFAULT;
                colInfo.data_type = resp.DATA_TYPE;//TODO:Parse to Typeorm types
                colInfo.char_max_lenght = resp.CHARACTER_MAXIMUM_LENGTH;
                ent.Columns.push(colInfo);
            })
        })
        return entities;
    }
    async GetIndexesFromEntity(entities: EntityInfo[]) {
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
    GetForeignKeysFromEntity(entities: EntityInfo[]) {
        throw new Error('Method not implemented.');
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
                        //TODO:Report errors
                        reject(err)
                    }
                });
            }
        )

        await promise;
    }
}