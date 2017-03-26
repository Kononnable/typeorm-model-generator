import { MssqlDriver } from './drivers/MssqlDriver'
import { AbstractDriver } from "./drivers/AbstractDriver";
/**
 * Engine
 */
export class Engine {
    constructor(public Options: EngineOptions, private driver:AbstractDriver) {
    }

    public createModelFromDatabase(): boolean {
        let entities = this.getEntitiesInfo();
        if (entities.length>0) {
            this.createModelFromMetadata(entities);
        } else {
            console.error('Tables not found in selected database. Skipping creation of typeorm model.');
        }
        return true;
    }
    private getEntitiesInfo(): EntityInfo[] {
        return [];
    }
    private createModelFromMetadata(entities: EntityInfo[]) {

    }
}
export interface EngineOptions {
    host:string,
    port:string,
    databaseName:string,
    user:string,
    password:string
}