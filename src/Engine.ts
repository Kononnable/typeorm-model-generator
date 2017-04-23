import { MssqlDriver } from './drivers/MssqlDriver'
import { AbstractDriver } from "./drivers/AbstractDriver";
import * as Mustache from 'mustache'
import fs = require('fs');
import path = require('path')
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
        let templatePath = path.resolve(__dirname,'entity.mst')
        let template = fs.readFileSync(templatePath,'UTF-8');
        //TODO:get results path to argvs, check if dir exists before
        let resultPath = path.resolve(__dirname,'../results')
        //TODO:Refactor to new method
        fs.writeFileSync(path.resolve(resultPath,'tsconfig.json'),`{"compilerOptions": {
        "lib": ["es5", "es6"],
        "target": "es6",
        "module": "commonjs",
        "moduleResolution": "node",
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "sourceMap": true
    }}`,{encoding:'UTF-8',flag:'w'});
    //TODO:Create ormconfig file
        databaseModel.entities.forEach(element => {
             let resultFilePath = path.resolve(resultPath,element.EntityName+'.ts');
             let rendered = Mustache.render(template, element);
             fs.writeFileSync(resultFilePath,rendered,{encoding:'UTF-8',flag:'w'})
        });
    }
}
export interface EngineOptions {
    host: string,
    port: number,
    databaseName: string,
    user: string,
    password: string
}