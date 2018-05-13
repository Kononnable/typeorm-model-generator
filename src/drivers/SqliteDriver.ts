import { AbstractDriver } from "./AbstractDriver";
import { ColumnInfo } from "./../models/ColumnInfo";
import { EntityInfo } from "./../models/EntityInfo";
import * as TomgUtils from "./../Utils";

export class SqliteDriver extends AbstractDriver {
    sqlite = require("sqlite3").verbose();
    db: any;
    tablesWithGeneratedPrimaryKey: String[] = new Array<String>();
    GetAllTablesQuery: any;

    async GetAllTables(schema: string): Promise<EntityInfo[]> {
        let ret: EntityInfo[] = <EntityInfo[]>[];
        let rows = await this.ExecQuery<{ tbl_name: string; sql: string }>(
            `SELECT tbl_name, sql FROM "sqlite_master" WHERE "type" = 'table'  AND name NOT LIKE 'sqlite_%'`
        );
        rows.forEach(val => {
            let ent: EntityInfo = new EntityInfo();
            ent.EntityName = val.tbl_name;
            ent.Columns = <ColumnInfo[]>[];
            ent.Indexes = <IndexInfo[]>[];
            if (val.sql.includes("AUTOINCREMENT")) {
                this.tablesWithGeneratedPrimaryKey.push(ent.EntityName);
            }
            ret.push(ent);
        });
        return ret;
    }
    async GetCoulmnsFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        for (const ent of entities) {
            let response = await this.ExecQuery<{
                cid: number;
                name: string;
                type: string;
                notnull: number;
                dflt_value: string;
                pk: number;
            }>(`PRAGMA table_info('${ent.EntityName}');`);
            response.forEach(resp => {
                let colInfo: ColumnInfo = new ColumnInfo();
                colInfo.name = resp.name;
                colInfo.is_nullable = resp.notnull == 0;
                colInfo.isPrimary = resp.pk > 0;
                colInfo.default = resp.dflt_value ? resp.dflt_value : null;
                colInfo.sql_type = resp.type
                    .replace(/\([0-9 ,]+\)/g, "")
                    .toLowerCase()
                    .trim();
                colInfo.is_generated =
                    colInfo.isPrimary &&
                    this.tablesWithGeneratedPrimaryKey.includes(ent.EntityName);
                switch (colInfo.sql_type) {
                    case "int":
                        colInfo.ts_type = "number";
                        break;
                    case "integer":
                        colInfo.ts_type = "number";
                        break;
                    case "int2":
                        colInfo.ts_type = "number";
                        break;
                    case "int8":
                        colInfo.ts_type = "number";
                        break;
                    case "tinyint":
                        colInfo.ts_type = "number";
                        break;
                    case "smallint":
                        colInfo.ts_type = "number";
                        break;
                    case "mediumint":
                        colInfo.ts_type = "number";
                        break;
                    case "bigint":
                        colInfo.ts_type = "string";
                        break;
                    case "unsigned big int":
                        colInfo.ts_type = "string";
                        break;
                    case "character":
                        colInfo.ts_type = "string";
                        break;
                    case "varchar":
                        colInfo.ts_type = "string";
                        break;
                    case "varying character":
                        colInfo.ts_type = "string";
                        break;
                    case "nchar":
                        colInfo.ts_type = "string";
                        break;
                    case "native character":
                        colInfo.ts_type = "string";
                        break;
                    case "nvarchar":
                        colInfo.ts_type = "string";
                        break;
                    case "text":
                        colInfo.ts_type = "string";
                        break;
                    case "blob":
                        colInfo.ts_type = "Buffer";
                        break;
                    case "clob":
                        colInfo.ts_type = "string";
                        break;
                    case "real":
                        colInfo.ts_type = "number";
                        break;
                    case "double":
                        colInfo.ts_type = "number";
                        break;
                    case "double precision":
                        colInfo.ts_type = "number";
                        break;
                    case "float":
                        colInfo.ts_type = "number";
                        break;
                    case "numeric":
                        colInfo.ts_type = "number";
                        break;
                    case "decimal":
                        colInfo.ts_type = "number";
                        break;
                    case "boolean":
                        colInfo.ts_type = "boolean";
                        break;
                    case "date":
                        colInfo.ts_type = "string";
                        break;
                    case "datetime":
                        colInfo.ts_type = "Date";
                        break;
                    default:
                        console.log(colInfo.sql_type.toLowerCase().trim());
                        TomgUtils.LogError(
                            `Unknown column type: ${
                                colInfo.sql_type
                            }  table name: ${ent.EntityName} column name: ${
                                resp.name
                            }`
                        );
                        break;
                }
                let options = resp.type.match(/\([0-9 ,]+\)/g);
                if (
                    this.ColumnTypesWithPrecision.some(
                        v => v == colInfo.sql_type
                    ) &&
                    options
                ) {
                    colInfo.numericPrecision = <any>options[0]
                        .substring(1, options[0].length - 1)
                        .split(",")[0];
                    colInfo.numericScale = <any>options[0]
                        .substring(1, options[0].length - 1)
                        .split(",")[1];
                }
                if (
                    this.ColumnTypesWithLength.some(
                        v => v == colInfo.sql_type
                    ) &&
                    options
                ) {
                    colInfo.lenght = <any>options[0].substring(
                        1,
                        options[0].length - 1
                    );
                }
                if (
                    this.ColumnTypesWithWidth.some(
                        v =>
                            v == colInfo.sql_type &&
                            colInfo.ts_type != "boolean"
                    ) &&
                    options
                ) {
                    colInfo.width = <any>options[0].substring(
                        1,
                        options[0].length - 1
                    );
                }

                if (colInfo.sql_type) ent.Columns.push(colInfo);
            });
        }

        return entities;
    }
    async GetIndexesFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        for (const ent of entities) {
            let response = await this.ExecQuery<{
                seq: number;
                name: string;
                unique: number;
                origin: string;
                partial: number;
            }>(`PRAGMA index_list('${ent.EntityName}');`);
            for (const resp of response) {
                let indexColumnsResponse = await this.ExecQuery<{
                    seqno: number;
                    cid: number;
                    name: string;
                }>(`PRAGMA index_info('${resp.name}');`);
                indexColumnsResponse.forEach(element => {
                    let indexInfo: IndexInfo = <IndexInfo>{};
                    let indexColumnInfo: IndexColumnInfo = <IndexColumnInfo>{};
                    if (
                        ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp.name;
                        }).length > 0
                    ) {
                        indexInfo = ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp.name;
                        })[0];
                    } else {
                        indexInfo.columns = <IndexColumnInfo[]>[];
                        indexInfo.name = resp.name;
                        indexInfo.isUnique = resp.unique == 1;
                        ent.Indexes.push(indexInfo);
                    }
                    indexColumnInfo.name = element.name;
                    if (
                        indexColumnsResponse.length == 1 &&
                        indexInfo.isUnique
                    ) {
                        ent.Columns.filter(
                            v => v.name == indexColumnInfo.name
                        ).map(v => (v.is_unique = true));
                    }
                    indexInfo.columns.push(indexColumnInfo);
                });
            }
        }

        return entities;
    }
    async GetRelations(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        for (const entity of entities) {
            let response = await this.ExecQuery<{
                id: number;
                seq: number;
                table: string;
                from: string;
                to: string;
                on_update: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
                on_delete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
                match: string;
            }>(`PRAGMA foreign_key_list('${entity.EntityName}');`);
            let relationsTemp: RelationTempInfo[] = <RelationTempInfo[]>[];
            response.forEach(resp => {
                let rels = <RelationTempInfo>{};
                rels.ownerColumnsNames = [];
                rels.referencedColumnsNames = [];
                rels.actionOnDelete =
                    resp.on_delete == "NO ACTION" ? null : resp.on_delete;
                rels.actionOnUpdate =
                    resp.on_update == "NO ACTION" ? null : resp.on_update;
                rels.ownerTable = entity.EntityName;
                rels.referencedTable = resp.table;
                relationsTemp.push(rels);
                rels.ownerColumnsNames.push(resp.from);
                rels.referencedColumnsNames.push(resp.to);
            });
            entities = this.GetRelationsFromRelationTempInfo(
                relationsTemp,
                entities
            );
        }
        return entities;
    }
    async DisconnectFromServer() {
        this.db.close();
    }

    async ConnectToServer(
        database: string,
        server: string,
        port: number,
        user: string,
        password: string,
        ssl: boolean
    ) {
        await this.UseDB(database);
    }

    async CreateDB(dbName: string) {}
    async UseDB(dbName: string) {
        let promise = new Promise<boolean>((resolve, reject) => {
            this.db = new this.sqlite.Database(dbName, err => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        return promise;
    }
    async DropDB(dbName: string) {}
    async CheckIfDBExists(dbName: string): Promise<boolean> {
        return true;
    }

    async ExecQuery<T>(sql: string): Promise<Array<T>> {
        let ret: any;
        let promise = new Promise<boolean>((resolve, reject) => {
            this.db.serialize(() => {
                this.db.all(sql, [], function(err, row) {
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
}
