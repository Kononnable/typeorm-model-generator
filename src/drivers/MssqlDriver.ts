import { AbstractDriver } from './abstractDriver'
import * as MSSQL from 'mssql'
/**
 * MssqlDriver
 */
export class MssqlDriver extends AbstractDriver {
    async GetAllTables(): Promise<EntityInfo[]> {
        let request = new MSSQL.Request(this.Connection)
        let response: { TABLE_SCHEMA: 'string', TABLE_NAME: 'string' }[]
            = await request.query("SELECT TABLE_SCHEMA,TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'");
        let ret:EntityInfo[]=<EntityInfo[]>[];
        response.forEach( (val)=>{
            let ent:EntityInfo=<EntityInfo>{};
            ent.EntityName=val.TABLE_NAME;
            ret.push(ent);
        })
        return ret;
    }
    GetCoulmnsFromEntity(entity: EntityInfo[]) {
        throw new Error('Method not implemented.');
    }
    GetIndexesFromEntity(entity: EntityInfo[]) {
        throw new Error('Method not implemented.');
    }
    GetForeignKeysFromEntity(entity: EntityInfo[]) {
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