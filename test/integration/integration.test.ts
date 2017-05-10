import "reflect-metadata";
import { createConnection, ConnectionOptions, Connection } from "typeorm";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "./../utils/test-utils"
import fs = require('fs');
import path = require('path')
import { Post } from "./examples/sample1-simple-entity/entity/Post";
import * as mockFS from "mock-fs";
import { Engine } from "./../../src/Engine";
import { AbstractDriver } from "./../../src/drivers/AbstractDriver";
import { MssqlDriver } from "./../../src/drivers/MssqlDriver";

describe("integration tests", function () {
    let connections: Connection[];

    describe('should ...', async () => {
        let examplesPath = path.resolve(__dirname, 'examples')
        let files = fs.readdirSync(examplesPath)
        // console.log(files)
        files.forEach(folder => {
            it(folder, async () => {
                connections = await createTestingConnections({
                    entities: [Post],
                    schemaCreate: true,
                })
                await connections.forEach(async conn => {

                    // conn.s
                    console.log('aa')
                    //TODO get model from db
                    await conn.entityManager.query(`select 'TODO'`)//depends on driver - remove tables
                    //compare models
                    if (conn.isConnected)
                     await conn.close() 
                     let q=conn.isConnected
                    console.log(q)


                    let resultPath = path.resolve(__dirname, '../model')
                    mockFS({ resultPath: {} })


                    var driver: AbstractDriver;

                    driver = new MssqlDriver();
                    let standardPort = 1433;

                    let engine = new Engine(
                        driver, {
                            host: 'localhost',
                            port: standardPort,
                            databaseName: 'test',
                            user: 'sa',
                            password: 'password',
                            databaseType: 'mssql',
                            resultsPath: `test/model`
                        });


                    let result = await engine.createModelFromDatabase()
                    console.log(result);
                });

            })

        });
    })

    // describe("sample1", async function () {
    //     connections = await createTestingConnections({
    //         //entities: [Post],
    //         schemaCreate: false,
    //     })
    //     await connections.forEach( async conn => {
    //         await conn.syncSchema()
    //         conn.entityManager.query('TODO')//depends on 
    //     });
    //     closeTestingConnections(connections)

    //     //foreach driver
    //     //create model from db
    //     //compare models

    // })
});

