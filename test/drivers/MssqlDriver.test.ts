import { expect } from "chai";
import * as MSSQL from 'mssql'
import { IColumnMetadata, Table } from "mssql";
import * as Sinon from 'sinon'
import { MssqlDriver } from '../../src/drivers/MssqlDriver'
import { ColumnInfo } from '../../src/models/ColumnInfo'
import { EntityInfo } from '../../src/models/EntityInfo'
import { RelationInfo } from '../../src/models/RelationInfo'
import { NamingStrategy } from "../../src/NamingStrategy";

class fakeResponse implements MSSQL.IResult<any>  {
    public recordsets: Array<MSSQL.IRecordSet<any>>;
    public recordset: MSSQL.IRecordSet<any>;
    public rowsAffected: number[];
    public output: { [key: string]: any; };
}

class fakeRecordset extends Array<any> implements MSSQL.IRecordSet<any>{
    public columns: IColumnMetadata;
    public toTable(): Table {
        return new Table();
    }
}

describe('MssqlDriver', function () {
    let driver: MssqlDriver
    const sandbox = Sinon.sandbox.create()

    beforeEach(() => {
        driver = new MssqlDriver();
        driver.namingStrategy = new NamingStrategy();
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('should get tables info', async () => {
        sandbox.stub(MSSQL, 'Request')
            .returns(
            {
                query: (q) => {
                    const response = new fakeResponse();
                    response.recordset = new fakeRecordset();
                    response.recordset.push({ TABLE_SCHEMA: 'schema', TABLE_NAME: 'name' })
                    return response;
                }
            })
        const result = await driver.GetAllTables('schema')
        const expectedResult = [] as EntityInfo[];
        const y = new EntityInfo();
        y.tsEntityName = 'name'
        y.sqlEntityName = 'name'
        y.Schema='schema'
        y.Columns = [] as ColumnInfo[];
        y.Indexes = [] as IndexInfo[];
        expectedResult.push(y)
        expect(result).to.be.deep.equal(expectedResult)
    })
    it('should get columns info', async () => {
        sandbox.stub(MSSQL, 'Request')
            .returns(
            {
                query: (q) => {
                    const response = new fakeResponse();
                    response.recordset = new fakeRecordset();
                    response.recordset.push({
                        TABLE_NAME: 'name', CHARACTER_MAXIMUM_LENGTH: 0,
                        COLUMN_DEFAULT: "'a'", COLUMN_NAME: 'name', DATA_TYPE: 'int',
                        IS_NULLABLE: 'YES', NUMERIC_PRECISION: 0, NUMERIC_SCALE: 0,
                        IsIdentity: 1
                    })
                    return response;
                }
            })

        const entities = [] as EntityInfo[];
        const y = new EntityInfo();
        y.tsEntityName = 'name'
        y.Columns = [] as ColumnInfo[];
        y.Indexes = [] as IndexInfo[];
        entities.push(y)
        const expected: EntityInfo[] = JSON.parse(JSON.stringify(entities));
        expected[0].Columns.push({
            lenght: null,
            default: `() => "'a'"`,
            isNullable: true,
            isPrimary: false,
            isGenerated: true,
            tsName: 'name',
            sqlName: 'name',
            numericPrecision: null,
            numericScale: null,
            width: null,
            sqlType: 'int',
            tsType: 'number',
            enumOptions: null,
            isUnique:false,
            isArray:false,
            relations: [] as RelationInfo[],
        })
        const result = await driver.GetCoulmnsFromEntity(entities, 'schema');
        expect(result).to.be.deep.equal(expected)
    })
    it('should find primary indexes')
    it('should get indexes info')
    it('should get relations info')
})
