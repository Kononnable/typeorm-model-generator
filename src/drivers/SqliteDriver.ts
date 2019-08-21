import { ConnectionOptions } from "typeorm";
import * as TypeormDriver from "typeorm/driver/sqlite/SqliteDriver";
import { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults";
import * as sqliteLib from "sqlite3";
import * as TomgUtils from "../Utils";
import AbstractDriver from "./AbstractDriver";
import EntityInfo from "../models/EntityInfo";
import ColumnInfo from "../models/ColumnInfo";
import IndexInfo from "../models/IndexInfo";
import IndexColumnInfo from "../models/IndexColumnInfo";
import RelationTempInfo from "../models/RelationTempInfo";
import IConnectionOptions from "../IConnectionOptions";

export default class SqliteDriver extends AbstractDriver {
    public defaultValues: DataTypeDefaults = new TypeormDriver.SqliteDriver({
        options: { database: "true" } as ConnectionOptions
    } as any).dataTypeDefaults;

    public readonly standardPort = 0;

    public readonly standardUser = "";

    public readonly standardSchema = "";

    public sqlite = sqliteLib.verbose();

    public db: any;

    public tablesWithGeneratedPrimaryKey: string[] = new Array<string>();

    public GetAllTablesQuery: any;

    public async GetAllTables(): Promise<EntityInfo[]> {
        const ret: EntityInfo[] = [] as EntityInfo[];
        const rows = await this.ExecQuery<{ tbl_name: string; sql: string }>(
            `SELECT tbl_name, sql FROM "sqlite_master" WHERE "type" = 'table'  AND name NOT LIKE 'sqlite_%'`
        );
        rows.forEach(val => {
            const ent: EntityInfo = new EntityInfo();
            ent.tsEntityName = val.tbl_name;
            ent.Columns = [] as ColumnInfo[];
            ent.Indexes = [] as IndexInfo[];
            if (val.sql.includes("AUTOINCREMENT")) {
                this.tablesWithGeneratedPrimaryKey.push(ent.tsEntityName);
            }
            ret.push(ent);
        });
        return ret;
    }

    public async GetCoulmnsFromEntity(
        entities: EntityInfo[]
    ): Promise<EntityInfo[]> {
        await Promise.all(
            entities.map(async ent => {
                const response = await this.ExecQuery<{
                    cid: number;
                    name: string;
                    type: string;
                    notnull: number;
                    dflt_value: string;
                    pk: number;
                }>(`PRAGMA table_info('${ent.tsEntityName}');`);
                response.forEach(resp => {
                    const colInfo: ColumnInfo = new ColumnInfo();
                    colInfo.tsName = resp.name;
                    colInfo.options.name = resp.name;
                    colInfo.options.nullable = resp.notnull === 0;
                    colInfo.options.primary = resp.pk > 0;
                    colInfo.options.default = SqliteDriver.ReturnDefaultValueFunction(
                        resp.dflt_value
                    );
                    colInfo.options.type = resp.type
                        .replace(/\([0-9 ,]+\)/g, "")
                        .toLowerCase()
                        .trim() as any;
                    colInfo.options.generated =
                        colInfo.options.primary &&
                        this.tablesWithGeneratedPrimaryKey.includes(
                            ent.tsEntityName
                        );
                    switch (colInfo.options.type) {
                        case "int":
                            colInfo.tsType = "number";
                            break;
                        case "integer":
                            colInfo.tsType = "number";
                            break;
                        case "int2":
                            colInfo.tsType = "number";
                            break;
                        case "int8":
                            colInfo.tsType = "number";
                            break;
                        case "tinyint":
                            colInfo.tsType = "number";
                            break;
                        case "smallint":
                            colInfo.tsType = "number";
                            break;
                        case "mediumint":
                            colInfo.tsType = "number";
                            break;
                        case "bigint":
                            colInfo.tsType = "string";
                            break;
                        case "unsigned big int":
                            colInfo.tsType = "string";
                            break;
                        case "character":
                            colInfo.tsType = "string";
                            break;
                        case "varchar":
                            colInfo.tsType = "string";
                            break;
                        case "varying character":
                            colInfo.tsType = "string";
                            break;
                        case "nchar":
                            colInfo.tsType = "string";
                            break;
                        case "native character":
                            colInfo.tsType = "string";
                            break;
                        case "nvarchar":
                            colInfo.tsType = "string";
                            break;
                        case "text":
                            colInfo.tsType = "string";
                            break;
                        case "blob":
                            colInfo.tsType = "Buffer";
                            break;
                        case "clob":
                            colInfo.tsType = "string";
                            break;
                        case "real":
                            colInfo.tsType = "number";
                            break;
                        case "double":
                            colInfo.tsType = "number";
                            break;
                        case "double precision":
                            colInfo.tsType = "number";
                            break;
                        case "float":
                            colInfo.tsType = "number";
                            break;
                        case "numeric":
                            colInfo.tsType = "number";
                            break;
                        case "decimal":
                            colInfo.tsType = "number";
                            break;
                        case "boolean":
                            colInfo.tsType = "boolean";
                            break;
                        case "date":
                            colInfo.tsType = "string";
                            break;
                        case "datetime":
                            colInfo.tsType = "Date";
                            break;
                        default:
                            TomgUtils.LogError(
                                `Unknown column type: ${colInfo.options.type}  table name: ${ent.tsEntityName} column name: ${resp.name}`
                            );
                            break;
                    }
                    const options = resp.type.match(/\([0-9 ,]+\)/g);
                    if (
                        this.ColumnTypesWithPrecision.some(
                            v => v === colInfo.options.type
                        ) &&
                        options
                    ) {
                        colInfo.options.precision = options[0]
                            .substring(1, options[0].length - 1)
                            .split(",")[0] as any;
                        colInfo.options.scale = options[0]
                            .substring(1, options[0].length - 1)
                            .split(",")[1] as any;
                    }
                    if (
                        this.ColumnTypesWithLength.some(
                            v => v === colInfo.options.type
                        ) &&
                        options
                    ) {
                        colInfo.options.length = options[0].substring(
                            1,
                            options[0].length - 1
                        ) as any;
                    }
                    if (
                        this.ColumnTypesWithWidth.some(
                            v =>
                                v === colInfo.options.type &&
                                colInfo.tsType !== "boolean"
                        ) &&
                        options
                    ) {
                        colInfo.options.width = options[0].substring(
                            1,
                            options[0].length - 1
                        ) as any;
                    }

                    if (colInfo.options.type) {
                        ent.Columns.push(colInfo);
                    }
                });
            })
        );

        return entities;
    }

    public async GetIndexesFromEntity(
        entities: EntityInfo[]
    ): Promise<EntityInfo[]> {
        await Promise.all(
            entities.map(async ent => {
                const response = await this.ExecQuery<{
                    seq: number;
                    name: string;
                    unique: number;
                    origin: string;
                    partial: number;
                }>(`PRAGMA index_list('${ent.tsEntityName}');`);
                await Promise.all(
                    response.map(async resp => {
                        const indexColumnsResponse = await this.ExecQuery<{
                            seqno: number;
                            cid: number;
                            name: string;
                        }>(`PRAGMA index_info('${resp.name}');`);
                        indexColumnsResponse.forEach(element => {
                            let indexInfo: IndexInfo = {} as IndexInfo;
                            const indexColumnInfo: IndexColumnInfo = {} as IndexColumnInfo;
                            if (
                                ent.Indexes.filter(filterVal => {
                                    return filterVal.name === resp.name;
                                }).length > 0
                            ) {
                                indexInfo = ent.Indexes.find(
                                    filterVal => filterVal.name === resp.name
                                )!;
                            } else {
                                indexInfo.columns = [] as IndexColumnInfo[];
                                indexInfo.name = resp.name;
                                indexInfo.isUnique = resp.unique === 1;
                                ent.Indexes.push(indexInfo);
                            }
                            indexColumnInfo.name = element.name;
                            if (
                                indexColumnsResponse.length === 1 &&
                                indexInfo.isUnique
                            ) {
                                ent.Columns.filter(
                                    v => v.tsName === indexColumnInfo.name
                                ).forEach(v => {
                                    // eslint-disable-next-line no-param-reassign
                                    v.options.unique = true;
                                });
                            }
                            indexInfo.columns.push(indexColumnInfo);
                        });
                    })
                );
            })
        );

        return entities;
    }

    public async GetRelations(entities: EntityInfo[]): Promise<EntityInfo[]> {
        let retVal = entities;
        await Promise.all(
            retVal.map(async entity => {
                const response = await this.ExecQuery<{
                    id: number;
                    seq: number;
                    table: string;
                    from: string;
                    to: string;
                    on_update:
                        | "RESTRICT"
                        | "CASCADE"
                        | "SET NULL"
                        | "NO ACTION";
                    on_delete:
                        | "RESTRICT"
                        | "CASCADE"
                        | "SET NULL"
                        | "NO ACTION";
                    match: string;
                }>(`PRAGMA foreign_key_list('${entity.tsEntityName}');`);
                const relationsTemp: RelationTempInfo[] = [] as RelationTempInfo[];
                response.forEach(resp => {
                    const rels = {} as RelationTempInfo;
                    rels.ownerColumnsNames = [];
                    rels.referencedColumnsNames = [];
                    rels.actionOnDelete =
                        resp.on_delete === "NO ACTION" ? null : resp.on_delete;
                    rels.actionOnUpdate =
                        resp.on_update === "NO ACTION" ? null : resp.on_update;
                    rels.ownerTable = entity.tsEntityName;
                    rels.referencedTable = resp.table;
                    relationsTemp.push(rels);
                    rels.ownerColumnsNames.push(resp.from);
                    rels.referencedColumnsNames.push(resp.to);
                });
                retVal = SqliteDriver.GetRelationsFromRelationTempInfo(
                    relationsTemp,
                    retVal
                );
            })
        );
        return retVal;
    }

    public async DisconnectFromServer() {
        this.db.close();
    }

    public async ConnectToServer(connectionOptons: IConnectionOptions) {
        await this.UseDB(connectionOptons.databaseName);
    }

    // eslint-disable-next-line class-methods-use-this
    public async CreateDB() {
        // not supported
    }

    public async UseDB(dbName: string) {
        const promise = new Promise<boolean>((resolve, reject) => {
            this.db = new this.sqlite.Database(dbName, err => {
                if (err) {
                    TomgUtils.LogError(
                        "Error connecting to SQLite database.",
                        false,
                        err.message
                    );
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        return promise;
    }

    // eslint-disable-next-line class-methods-use-this
    public async DropDB() {
        // not supported
    }

    // eslint-disable-next-line class-methods-use-this
    public async CheckIfDBExists(): Promise<boolean> {
        return true;
    }

    public async ExecQuery<T>(sql: string): Promise<T[]> {
        let ret: any;
        const promise = new Promise<boolean>((resolve, reject) => {
            this.db.serialize(() => {
                this.db.all(sql, [], (err, row) => {
                    if (!err) {
                        ret = row;
                        resolve(true);
                    } else {
                        TomgUtils.LogError(
                            "Error executing query on SQLite.",
                            false,
                            err.message
                        );
                        reject(err);
                    }
                });
            });
        });
        await promise;
        return ret;
    }

    private static ReturnDefaultValueFunction(
        defVal: string | null
    ): string | null {
        if (!defVal) {
            return null;
        }
        if (defVal.startsWith(`'`)) {
            return `() => "${defVal}"`;
        }
        return `() => "${defVal}"`;
    }
}
