import { MssqlDriver } from './drivers/MssqlDriver'
import { AbstractDriver } from "./drivers/AbstractDriver";
/**
 * Engine
 */
export class Engine {
    constructor(private driver: AbstractDriver, public Options: EngineOptions) {
    }

    public async createModelFromDatabase(): Promise<boolean> {
        let dbModel = await this.getEntitiesInfo(this.Options.databaseName, this.Options.host, this.Options.port, this.Options.user, this.Options.password);
        if (dbModel.entities.length > 0) {
            this.createModelFromMetadata(dbModel);
        } else {
            console.error('Tables not found in selected database. Skipping creation of typeorm model.');
        }
        return true;
    }
    private async getEntitiesInfo(database: string, server: string, port: number, user: string, password: string): Promise<DatabaseModel> {
       return await this.driver.GetDataFromServer(database, server, port, user, password)
        
    }
    private createModelFromMetadata(databaseModel: DatabaseModel) {

    }
}
export interface EngineOptions {
    host: string,
    port: number,
    databaseName: string,
    user: string,
    password: string
}