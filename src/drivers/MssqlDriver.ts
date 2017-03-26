import { AbstractDriver } from './abstractDriver'
import * as MSSQL from 'mssql'
/**
 * MssqlDriver
 */
export class MssqlDriver extends AbstractDriver {
    async GetAllTables(): Promise<EntityInfo[]> {
        let request =  new MSSQL.Request(this.Connection)
        let response = await request.query("SELECT TABLE_SCHEMA,TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'");
let x=1;
        throw new Error('Method not implemented.');
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
            // driver: 'msnodesqlv8'
        }
        this.Connection = new MSSQL.Connection(config)
        try {
            var con:any = this.Connection;
             let x = await con.connect("mssql://sa:password@localhost/AdventureWorksDW2014")
            // await this.Connection.connect( (err)=>{console.log(err);console.log('a');})
        } catch (error) {
            //TODO: errors on Connection
            console.error(error);
            process.abort();
        }
    }


}