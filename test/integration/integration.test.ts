import "reflect-metadata";
import { createConnection, ConnectionOptions, Connection } from "typeorm";
import { setupSingleTestingConnection, closeTestingConnections, reloadTestingDatabases } from "./../utils/test-utils"
import fs = require('fs-extra');
import path = require('path')
import { Post } from "./examples/sample1-simple-entity/entity/Post";
import * as mockFS from "mock-fs";
import { Engine } from "./../../src/Engine";
import { AbstractDriver } from "./../../src/drivers/AbstractDriver";
import { MssqlDriver } from "./../../src/drivers/MssqlDriver";
import { DriverType } from "typeorm/driver/DriverOptions";
import { expect } from "chai";
import * as Sinon from 'sinon'


  describe("integration tests", async function () {
        let examplesPath = path.resolve(process.cwd(), 'test/integration/examples')
        let files = fs.readdirSync(examplesPath)
        // console.log(files)
        
    let dbDrivers:[DriverType]=['mssql']

        for( let folder of files){
        // files.forEach( async folder => {
            
            describe(folder, async function  () {
    
            for (let dbDriver of dbDrivers){
     it(dbDriver,async function() {
            let connOpt =await setupSingleTestingConnection(<any>dbDriver,{
                    entities: [Post],
                    schemaCreate: true,
                })
                let conn = await createConnection(connOpt)
                await conn.entityManager.query(`select 'TODO'`)//depends on driver - remove tables
                if (conn.isConnected)
                    await conn.close()

                let driver: AbstractDriver;
                driver = new MssqlDriver();
                let standardPort = 1433;

let resultsPath= path.resolve(process.cwd(),`output`)
                let engine = new Engine(
                    driver, {
                        //TODO:get data from env
                        host: 'localhost',
                        port: standardPort,
                        databaseName: 'test',
                        user: 'sa',
                        password: 'password',
                        databaseType: 'mssql',
                        resultsPath: resultsPath
                    });
                    fs.removeSync(resultsPath)


                let result = await engine.createModelFromDatabase()
  
                //TODO:Compare reslts
                let filesOrgPath=path.resolve(examplesPath,folder,'entity')
                let filesGenPath=path.resolve(resultsPath,'entities')

                 let filesOrg = fs.readdirSync(filesOrgPath).map(function(this,val){return val.toString().toLowerCase();}).filter( function(this,val,ind,arr){return val.toString().endsWith('.ts')})
                 let filesGen = fs.readdirSync(filesGenPath).map(function(this,val){return val.toString().toLowerCase();}).filter( function(this,val,ind,arr){return val.toString().endsWith('.ts')})
                 
                 expect(filesOrg).to.be.deep.equal(filesGen)

                 for(let file of filesOrg){
                     
                     expect(fs.readFileSync(path.resolve(filesOrgPath,file)).toString()).to.be.eq(fs.readFileSync(path.resolve(filesGenPath,file)).toString())
                 }
});

        }
            })}
  })