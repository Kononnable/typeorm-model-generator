import { expect } from "chai";
import { MssqlDriver } from './../../src/drivers/MssqlDriver'
import * as Sinon from 'sinon'
import * as MSSQL from 'mssql'
import { EntityInfo } from './../../src/models/EntityInfo'
import { ColumnInfo } from './../../src/models/ColumnInfo'


describe('MssqlDriver', function () {
    let driver: MssqlDriver
    let sandbox = Sinon.sandbox.create()

    beforeEach(() => {
        driver = new MssqlDriver();
        // sandbox.mock()
        //  sandbox.stub( (<any>driver).Connection,)
        //  driver = Sinon.createStubInstance(MssqlDriver);

        //  sandbox.stub(MSSQL,'Connection')
        //  .callsFake( (a,b)=>{
        //      console.log(a)
        //      b({message:'a'})
        //  })
        // sandbox.stub(MSSQL.)
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('should get tables info', async () => {
        sandbox.stub(MSSQL, 'Request')
            .returns(
            {
                query: (q) => {
                    let response = <{ TABLE_SCHEMA: string, TABLE_NAME: string }[]>[];
                    response.push({ TABLE_SCHEMA: 'schema', TABLE_NAME: 'name' })
                    return response;
                }
            }
            )
        let result = await driver.GetAllTables()
        let expectedResult = <EntityInfo[]>[];
        let y = new EntityInfo();
        y.EntityName = 'name'
        y.Columns = <ColumnInfo[]>[];
        y.Indexes = <IndexInfo[]>[];
        expectedResult.push(y)
        expect(result).to.be.deep.equal(expectedResult)
    })
    it('should get columns info', async () => {
        sandbox.stub(MSSQL, 'Request')
            .returns(
            {
                query: (q) => {
                    let response = <{
                        TABLE_NAME: string, COLUMN_NAME: string, COLUMN_DEFAULT: string,
                        IS_NULLABLE: string, DATA_TYPE: string, CHARACTER_MAXIMUM_LENGTH: number,
                        NUMERIC_PRECISION: number, NUMERIC_SCALE: number
                    }[]>[]
                    response.push({
                        TABLE_NAME: 'name', CHARACTER_MAXIMUM_LENGTH: 0,
                        COLUMN_DEFAULT: 'a', COLUMN_NAME: 'name', DATA_TYPE: 'int',
                        IS_NULLABLE: 'YES', NUMERIC_PRECISION: 0, NUMERIC_SCALE: 0
                    })
                    return response;
                }
            }
            )


        let entities = <EntityInfo[]>[];
        let y = new EntityInfo();
        y.EntityName = 'name'
        y.Columns = <ColumnInfo[]>[];
        y.Indexes = <IndexInfo[]>[];
        entities.push(y)
        var expected: EntityInfo[] = JSON.parse(JSON.stringify(entities));
        expected[0].Columns.push({
            char_max_lenght: null,
            default: 'a',
            is_nullable: true,
            isPrimary: false,
            name: 'name',
            numericPrecision: null,
            numericScale: null,
            sql_type: 'int',
            ts_type: 'number',
            relations: <RelationInfo[]>[]
        })
        let result = await driver.GetCoulmnsFromEntity(entities);
        expect(result).to.be.deep.equal(expected)
    })
    it('should find primary indexes')
    it('should get indexes info')
    it('should get relations info')
})