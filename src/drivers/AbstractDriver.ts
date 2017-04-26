import {EntityInfo} from './../models/EntityInfo'
import {DatabaseModel} from './../models/DatabaseModel'
/**
 * AbstractDriver
 */
export abstract class AbstractDriver {
    async GetDataFromServer(database:string,server:string,port:number,user:string,password:string): Promise<DatabaseModel> {
        let dbModel=<DatabaseModel>{};
        await this.ConnectToServer(database,server,port,user,password);
        dbModel.entities = await this.GetAllTables();
        await this.GetCoulmnsFromEntity(dbModel.entities);
        await this.GetIndexesFromEntity(dbModel.entities);
        dbModel.entities = await this.GetRelations(dbModel.entities);
        await this.DisconnectFromServer();
        this.FindPrimaryColumnsFromIndexes(dbModel)
        return dbModel;
    }
    abstract async ConnectToServer(database:string,server:string,port:number,user:string,password:string);
    abstract async GetAllTables(): Promise<EntityInfo[]>
    abstract async GetCoulmnsFromEntity(entities: EntityInfo[]):Promise<EntityInfo[]>;
    abstract async GetIndexesFromEntity(entities: EntityInfo[]):Promise<EntityInfo[]>;
    abstract async GetRelations(entities: EntityInfo[]):Promise<EntityInfo[]>;
    abstract async FindPrimaryColumnsFromIndexes(dbModel:DatabaseModel);
    abstract async DisconnectFromServer();
}