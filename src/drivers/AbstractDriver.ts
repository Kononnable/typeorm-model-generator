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
        dbModel.relations = await this.GetRelations();
        await this.DisconnectFromServer();
        return dbModel;
    }
    abstract async ConnectToServer(database:string,server:string,port:number,user:string,password:string);
    abstract async GetAllTables(): Promise<EntityInfo[]>
    abstract async GetCoulmnsFromEntity(entity: EntityInfo[]);
    abstract async GetIndexesFromEntity(entity: EntityInfo[]);
    abstract async GetRelations():Promise<RelationInfo[]>;
    abstract async DisconnectFromServer();
}