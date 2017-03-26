/**
 * AbstractDriver
 */
export abstract class AbstractDriver {
    async GetDataFromServer(database:string,server:string,port:number,user:string,password:string): Promise<EntityInfo[]> {
        await this.ConnectToServer(database,server,port,user,password);
        let entities = await this.GetAllTables();
        await this.GetCoulmnsFromEntity(entities);
        await this.GetIndexesFromEntity(entities);
        await this.GetForeignKeysFromEntity(entities);
        await this.DisconnectFromServer();
        return entities;
    }
    abstract async ConnectToServer(database:string,server:string,port:number,user:string,password:string);
    abstract async GetAllTables(): Promise<EntityInfo[]>
    abstract async GetCoulmnsFromEntity(entity: EntityInfo[]);
    abstract async GetIndexesFromEntity(entity: EntityInfo[]);
    abstract async GetForeignKeysFromEntity(entity: EntityInfo[]);
    abstract async DisconnectFromServer();
}