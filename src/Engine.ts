import { AbstractDriver } from "./drivers/AbstractDriver";
import { DatabaseModel } from './models/DatabaseModel'
import * as Handlebars from 'handlebars'
import fs = require('fs');
import path = require('path')
/**
 * Engine
 */
export class Engine {
    constructor(private driver: AbstractDriver, public Options: EngineOptions) {
    }

    public async createModelFromDatabase(): Promise<boolean> {
        let dbModel = await this.getEntitiesInfo(this.Options.databaseName, this.Options.host, this.Options.port, this.Options.user, this.Options.password, this.Options.schemaName, this.Options.ssl);
        if (dbModel.entities.length > 0) {
            this.createModelFromMetadata(dbModel);
        } else {
            console.error('Tables not found in selected database. Skipping creation of typeorm model.');
        }
        return true;
    }
    private async getEntitiesInfo(database: string, server: string, port: number, user: string, password: string, schemaName:string, ssl:boolean): Promise<DatabaseModel> {
        return await this.driver.GetDataFromServer(database, server, port, user, password,schemaName,ssl)

    }
    private createModelFromMetadata(databaseModel: DatabaseModel) {
        let templatePath = path.resolve(__dirname, '../../src/entity.mst')
        let template = fs.readFileSync(templatePath, 'UTF-8');
        let resultPath = this.Options.resultsPath
        if (!fs.existsSync(resultPath))
            fs.mkdirSync(resultPath);
        this.createTsConfigFile(resultPath)
        this.createTypeOrm(resultPath)
        let entitesPath = path.resolve(resultPath, './entities')
        Handlebars.registerHelper('toLowerCase', function (str) {
            return str.toLowerCase();
        });
        if (!fs.existsSync(entitesPath))
            fs.mkdirSync(entitesPath);
            let compliedTemplate = Handlebars.compile(template,{noEscape:true})
        databaseModel.entities.forEach(element => {
            let resultFilePath = path.resolve(entitesPath, element.EntityName + '.ts');
            let rendered =compliedTemplate(element)
            fs.writeFileSync(resultFilePath, rendered, { encoding: 'UTF-8', flag: 'w' })
        });
    }
    private createTsConfigFile(resultPath) {
        fs.writeFileSync(path.resolve(resultPath, 'tsconfig.json'), `{"compilerOptions": {
        "lib": ["es5", "es6"],
        "target": "es6",
        "module": "commonjs",
        "moduleResolution": "node",
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "sourceMap": true
    }}`, { encoding: 'UTF-8', flag: 'w' });
    }
    private createTypeOrm(resultPath) {
        fs.writeFileSync(path.resolve(resultPath, 'ormconfig.json'), `[
  {
    "name": "default",
    "driver": {
      "type": "${this.Options.databaseType}",
      "host": "${this.Options.host}",
      "port": ${this.Options.port},
      "username": "${this.Options.user}",
      "password": "${this.Options.password}",
      "database": "${this.Options.databaseName}"
    },
    "entities": [
      "entities/*.js"
    ]
  }
]`, { encoding: 'UTF-8', flag: 'w' });
    }
}
export interface EngineOptions {
    host: string,
    port: number,
    databaseName: string,
    user: string,
    password: string,
    resultsPath: string,
    databaseType: string,
    schemaName:string,
    ssl:boolean
}