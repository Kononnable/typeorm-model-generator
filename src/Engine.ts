import { MssqlDriver } from './drivers/MssqlDriver'
import { AbstractDriver } from "./drivers/AbstractDriver";
/**
 * Engine
 */
export class Engine {
    constructor(private driver: AbstractDriver, public Options: EngineOptions) {
    }

    public async createModelFromDatabase(): Promise<boolean> {
        let entities = await this.getEntitiesInfo(this.Options.databaseName, this.Options.host, this.Options.port, this.Options.user, this.Options.password);
        if (entities.length > 0) {
            this.createModelFromMetadata(entities);
        } else {
            console.error('Tables not found in selected database. Skipping creation of typeorm model.');
        }
        return true;
    }
    private async getEntitiesInfo(database: string, server: string, port: number, user: string, password: string): Promise<EntityInfo[]> {
       await this.driver.GetDataFromServer(database, server, port, user, password)
        return [];
    }
    private createModelFromMetadata(entities: EntityInfo[]) {

    }
}
export interface EngineOptions {
    host: string,
    port: number,
    databaseName: string,
    user: string,
    password: string
}