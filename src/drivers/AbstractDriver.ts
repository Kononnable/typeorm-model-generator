import {EntityInfo} from './../models/EntityInfo';
import {DatabaseModel} from './../models/DatabaseModel';

export abstract class AbstractDriver {
    async GetDataFromServer(
        database: string,
        server: string,
        port: number,
        user: string,
        password: string,
        schema: string,
        ssl: boolean
    ): Promise<DatabaseModel> {
        const dbModel = <DatabaseModel>{};
        await this.ConnectToServer(database, server, port, user, password, ssl);
        let sqlEscapedSchema='\''+ schema.split(',').join('\',\'')+'\''
        dbModel.entities = await this.GetAllTables(sqlEscapedSchema);
        await this.GetCoulmnsFromEntity(dbModel.entities, sqlEscapedSchema);
        await this.GetIndexesFromEntity(dbModel.entities, sqlEscapedSchema);
        dbModel.entities = await this.GetRelations(dbModel.entities, sqlEscapedSchema);
        await this.DisconnectFromServer();
        this.FindPrimaryColumnsFromIndexes(dbModel);
        return dbModel;
    }

    abstract async ConnectToServer(
        database: string,
        server: string,
        port: number,
        user: string,
        password: string,
        ssl: boolean
    );

    abstract async GetAllTables(schema: string): Promise<EntityInfo[]>;
    abstract async GetCoulmnsFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]>;
    
    abstract async GetIndexesFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]>;

    abstract async GetRelations(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]>;

    abstract async FindPrimaryColumnsFromIndexes(dbModel: DatabaseModel);
    abstract async DisconnectFromServer();

    abstract async CreateDB(dbName: string);
    abstract async DropDB(dbName: string);
    abstract async UseDB(dbName: string);
    abstract async CheckIfDBExists(dbName: string): Promise<boolean>;
}
