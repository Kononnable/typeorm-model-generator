import { expect } from "chai";
import * as MSSQL from "mssql";
import * as Sinon from "sinon";
import MssqlDriver from "../../src/drivers/MssqlDriver";
import { Entity } from "../../src/models/Entity";

interface FakeResponse extends MSSQL.IResult<any> {
    recordsets: MSSQL.IRecordSet<any>[];

    recordset: MSSQL.IRecordSet<any>;

    rowsAffected: number[];

    output: { [key: string]: any };
}

class FakeRecordset extends Array<any> implements MSSQL.IRecordSet<any> {
    public columns: MSSQL.IColumnMetadata;

    // eslint-disable-next-line class-methods-use-this
    public toTable(): MSSQL.Table {
        return new MSSQL.Table();
    }
}

describe("MssqlDriver", () => {
    let driver: MssqlDriver;
    const sandbox = Sinon.sandbox.create();

    beforeEach(() => {
        driver = new MssqlDriver();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("should get tables info", async () => {
        sandbox.stub(MSSQL, "Request").returns({
            query: () => {
                const response = {} as FakeResponse;
                response.recordset = new FakeRecordset();
                response.recordset.push({
                    TABLE_SCHEMA: "schema",
                    TABLE_NAME: "name"
                });
                return response;
            }
        });
        const result = await driver.GetAllTables("schema", "db", []);
        const expectedResult = [] as Entity[];
        const y: Entity = {
            columns: [],
            indices: [],
            relationIds: [],
            relations: [],
            sqlName: "name",
            tscName: "name",
            schema: "schema",
            database: "",
            fileImports: []
        };
        expectedResult.push(y);
        expect(result).to.be.deep.equal(expectedResult);
    });
    it("should get columns info", async () => {
        sandbox.stub(MSSQL, "Request").returns({
            query: () => {
                const response = {} as FakeResponse;
                response.recordset = new FakeRecordset();
                response.recordset.push({
                    TABLE_NAME: "name",
                    CHARACTER_MAXIMUM_LENGTH: 0,
                    COLUMN_DEFAULT: "'a'",
                    COLUMN_NAME: "name",
                    DATA_TYPE: "int",
                    IS_NULLABLE: "NO",
                    NUMERIC_PRECISION: 0,
                    NUMERIC_SCALE: 0,
                    IsIdentity: 1
                });
                return response;
            }
        });

        const entities = [] as Entity[];
        const y: Entity = {
            columns: [],
            indices: [],
            relationIds: [],
            relations: [],
            sqlName: "name",
            tscName: "name",
            schema: "schema",
            database: "",
            fileImports: []
        };
        entities.push(y);
        const expected: Entity[] = JSON.parse(JSON.stringify(entities));
        expected[0].columns.push({
            options: {
                name: "name"
            },
            type: "int",
            generated: true,
            default: `() => "'a'"`,
            tscName: "name",
            tscType: "number"
        });

        const result = await driver.GetCoulmnsFromEntity(
            entities,
            "schema",
            "db"
        );
        expect(result).to.be.deep.equal(expected);
    });
    it("should find primary indexes");
    it("should get indexes info");
    it("should get relations info");
});
