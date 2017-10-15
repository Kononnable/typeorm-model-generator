import { EntityInfo } from './../models/EntityInfo'
import { DatabaseModel } from './../models/DatabaseModel'
/**
 * AbstractDriver
 */
export abstract class AbstractDriver {
    async GetDataFromServer(database: string, server: string, port: number, user: string, password: string, schema:string): Promise<DatabaseModel> {
        let dbModel = <DatabaseModel>{};
        await this.ConnectToServer(database, server, port, user, password);
        dbModel.entities = await this.GetAllTables(schema);
        await this.GetCoulmnsFromEntity(dbModel.entities,schema);
        await this.GetIndexesFromEntity(dbModel.entities,schema);
        dbModel.entities = await this.GetRelations(dbModel.entities,schema);
        await this.DisconnectFromServer();
        this.FindPrimaryColumnsFromIndexes(dbModel)
        return dbModel;
    }
    abstract async ConnectToServer(database: string, server: string, port: number, user: string, password: string);
    abstract async GetAllTables(schema:string): Promise<EntityInfo[]>
    abstract async GetCoulmnsFromEntity(entities: EntityInfo[],schema:string): Promise<EntityInfo[]>;
    abstract async GetIndexesFromEntity(entities: EntityInfo[],schema:string): Promise<EntityInfo[]>;
    abstract async GetRelations(entities: EntityInfo[],schema:string): Promise<EntityInfo[]>;
    abstract async FindPrimaryColumnsFromIndexes(dbModel: DatabaseModel);
    abstract async DisconnectFromServer();

    abstract async CreateDB(dbName: string);
    abstract async DropDB(dbName: string);
    abstract async UseDB(dbName: string);
    abstract async CheckIfDBExists(dbName: string): Promise<boolean>;
}