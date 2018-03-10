import * as PG from 'pg';
import {AbstractDriver} from './AbstractDriver';
import {ColumnInfo} from './../models/ColumnInfo';
import {EntityInfo} from './../models/EntityInfo';
import {RelationInfo} from './../models/RelationInfo';
import {DatabaseModel} from './../models/DatabaseModel';
import * as TomgUtils from './../Utils';

export class PostgresDriver extends AbstractDriver {
    private Connection: PG.Client;

    FindPrimaryColumnsFromIndexes(dbModel: DatabaseModel) {
        dbModel.entities.forEach(entity => {
            let primaryIndex = entity.Indexes.find(v => v.isPrimaryKey);
            if (!primaryIndex) {
                TomgUtils.LogFatalError(
                    `Table ${entity.EntityName} has no PK.`,
                    false
                );
                return;
            }
            entity.Columns.forEach(col => {
                if (
                    primaryIndex!.columns.some(
                        cIndex => cIndex.name == col.name
                    )
                )
                    col.isPrimary = true;
            });
        });
    }

    async GetAllTables(schema: string): Promise<EntityInfo[]> {
        let response: {
            table_schema: string;
            table_name: string;
        }[] = (await this.Connection.query(
            `SELECT table_schema,table_name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' AND table_schema in (${schema}) `
        )).rows;

        let ret: EntityInfo[] = <EntityInfo[]>[];
        response.forEach(val => {
            let ent: EntityInfo = new EntityInfo();
            ent.EntityName = val.table_name;
            ent.Schema=val.table_schema;
            ent.Columns = <ColumnInfo[]>[];
            ent.Indexes = <IndexInfo[]>[];
            ret.push(ent);
        });
        return ret;
    }
    async GetCoulmnsFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let response: {
            table_name: string;
            column_name: string;
            column_default: string;
            isNullable: string;
            data_type: string;
            character_maximum_length: number;
            numeric_precision: number;
            numeric_scale: number;
            isidentity: string;
        }[] = (await this.Connection
            .query(`SELECT table_name,column_name,column_default,isNullable,
            data_type,character_maximum_length,numeric_precision,numeric_scale
            --,COLUMNPROPERTY(object_id(table_name), column_name, 'isidentity') isidentity
           , case when column_default LIKE 'nextval%' then 'YES' else 'NO' end isidentity
            FROM INFORMATION_SCHEMA.COLUMNS where table_schema in (${schema})`))
            .rows;
        entities.forEach(ent => {
            response
                .filter(filterVal => {
                    return filterVal.table_name == ent.EntityName;
                })
                .forEach(resp => {
                    let colInfo: ColumnInfo = new ColumnInfo();
                    colInfo.name = resp.column_name;
                    colInfo.isNullable =
                        resp.isNullable == "YES" ? true : false;
                    colInfo.isGenerated =
                        resp.isidentity == "YES" ? true : false;
                    colInfo.columnType = colInfo.isGenerated
                        ? "PrimaryGeneratedColumn"
                        : "Column";
                    colInfo.default = colInfo.isGenerated
                        ? null
                        : resp.column_default;
                        colInfo.sqlType = resp.data_type;
                    colInfo.isDefaultType = false;
                    switch (resp.data_type) {
                        case "integer":
                            colInfo.isDefaultType = true;
                            colInfo.tsType = "number";
                            break;
                        case "character varying":
                            colInfo.isDefaultType = true;
                            colInfo.tsType = "string";
                            colInfo.charMaxLength =
                                resp.character_maximum_length > 0
                                    ? resp.character_maximum_length
                                    : null;
                            break;
                        case "text":
                            colInfo.tsType = "string";
                            break;
                        case "uuid":
                            colInfo.tsType = "string";
                            break;
                        case "smallint":
                            colInfo.tsType = "number";
                            break;
                        case "bigint":
                            colInfo.tsType = "string";
                            break;
                        case "date":
                            colInfo.tsType = "string";
                            break;
                        case "boolean":
                            colInfo.tsType = "boolean";
                            break;
                        case "double precision":
                            colInfo.tsType = "number";
                            colInfo.numericPrecision = resp.numeric_precision;
                            colInfo.numericScale = resp.numeric_scale;
                            break;
                        case "real":
                            colInfo.tsType = "number";
                            colInfo.numericPrecision = resp.numeric_precision;
                            colInfo.numericScale = resp.numeric_scale;
                            break;
                        case "numeric":
                            colInfo.tsType = "string";
                            colInfo.numericPrecision = resp.numeric_precision;
                            colInfo.numericScale = resp.numeric_scale;
                            break;
                        case "time without time zone":
                            colInfo.tsType = "string";
                            break;
                        case "timestamp without time zone":
                            colInfo.tsType = "Date";
                            break;
                        case "timestamp with time zone":
                            colInfo.tsType = "Date";
                            break;
                        case "timestamp with time zone":
                            colInfo.tsType = "Date";
                            break;
                        case "json":
                            colInfo.tsType = "Object";
                            break;
                        case "jsonb":
                            colInfo.tsType = "Object";
                            break;
                        case "money":
                            colInfo.tsType = "string";
                            break;
                        case "character":
                            colInfo.tsType = "string";
                            colInfo.charMaxLength =
                                resp.character_maximum_length > 0
                                    ? resp.character_maximum_length
                                    : null;
                            break;
                        case "bytea":
                            colInfo.tsType = "Buffer";
                            break;
                        case "interval":
                            colInfo.tsType = "any";
                            break;
                        case "time with time zone":
                            colInfo.tsType = "string";
                            break;
                        case "point":
                            colInfo.tsType = "string | Object";
                            break;
                        case "line":
                            colInfo.tsType = "string";
                            break;
                        case "lseg":
                            colInfo.tsType = "string | string[]";
                            break;
                        case "box":
                            colInfo.tsType = "string | Object";
                            break;
                        case "path":
                            colInfo.tsType = "string";
                            break;
                        case "polygon":
                            colInfo.tsType = "string";
                            break;
                        case "circle":
                            colInfo.tsType = "string | Object";
                            break;
                        case "cidr":
                            colInfo.tsType = "string";
                            break;
                        case "inet":
                            colInfo.tsType = "string";
                            break;
                        case "macaddr":
                            colInfo.tsType = "string";
                            break;
                        case "bit":
                            colInfo.tsType = "string";
                            break;
                        case "bit varying":
                            colInfo.tsType = "string";
                            break;
                        case "xml":
                            colInfo.tsType = "string";
                            break;
                        default:
                            TomgUtils.LogFatalError(
                                `Unknown column type: ${resp.data_type}  table name: ${resp.table_name} column name: ${resp.column_name}`
                            );
                            break;
                    }

                    if (colInfo.sqlType) ent.Columns.push(colInfo);
                });
        });
        return entities;
    }
    async GetIndexesFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let response: {
            tablename: string;
            indexname: string;
            columnname: string;
            is_unique: number;
            is_primary_key: number; //, is_descending_key: number//, is_included_column: number
        }[] = (await this.Connection.query(`SELECT
            c.relname AS tablename,
            i.relname as indexname,
            f.attname AS columnname,
            CASE
                WHEN ix.indisunique = true THEN '1'
                ELSE '0'
            END AS is_unique,
            CASE
                WHEN p.contype = 'p' THEN '1'
                ELSE '0'
            END AS is_primary_key
            FROM pg_attribute f
            JOIN pg_class c ON c.oid = f.attrelid
            JOIN pg_type t ON t.oid = f.atttypid
            LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = f.attnum
            LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
            LEFT JOIN pg_constraint p ON p.conrelid = c.oid AND f.attnum = ANY (p.conkey)
            LEFT JOIN pg_class AS g ON p.confrelid = g.oid
            LEFT JOIN pg_index AS ix ON f.attnum = ANY(ix.indkey) and c.oid = f.attrelid and c.oid = ix.indrelid
            LEFT JOIN pg_class AS i ON ix.indexrelid = i.oid

            WHERE c.relkind = 'r'::char
            AND n.nspname in (${schema})
            --AND c.relname = 'nodes'  -- Replace with table name, or Comment this for get all tables
            AND f.attnum > 0
            AND i.oid<>0
            ORDER BY c.relname,f.attname;`)).rows;
        entities.forEach(ent => {
            response
                .filter(filterVal => {
                    return filterVal.tablename == ent.EntityName;
                })
                .forEach(resp => {
                    let indexInfo: IndexInfo = <IndexInfo>{};
                    let indexColumnInfo: IndexColumnInfo = <IndexColumnInfo>{};
                    if (
                        ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp.indexname;
                        }).length > 0
                    ) {
                        indexInfo = ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp.indexname;
                        })[0];
                    } else {
                        indexInfo.columns = <IndexColumnInfo[]>[];
                        indexInfo.name = resp.indexname;
                        indexInfo.isUnique = resp.is_unique == 1 ? true : false;
                        indexInfo.isPrimaryKey =
                            resp.is_primary_key == 1 ? true : false;
                        ent.Indexes.push(indexInfo);
                    }
                    indexColumnInfo.name = resp.columnname;
                    if (resp.is_primary_key == 0) {
                        indexInfo.isPrimaryKey = false;
                    }
                    // indexColumnInfo.isIncludedColumn = resp.is_included_column == 1 ? true : false;
                    //indexColumnInfo.isDescending = resp.is_descending_key == 1 ? true : false;
                    indexInfo.columns.push(indexColumnInfo);
                });
        });

        return entities;
    }
    async GetRelations(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let response: {
            tablewithforeignkey: string;
            fk_partno: number;
            foreignkeycolumn: string;
            tablereferenced: string;
            foreignkeycolumnreferenced: string;
            ondelete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
            onupdate: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
            object_id: string;
        }[] = (await this.Connection.query(`SELECT
            con.relname AS tablewithforeignkey,
            att.attnum as fk_partno,
                 att2.attname AS foreignkeycolumn,
              cl.relname AS tablereferenced,
              att.attname AS foreignkeycolumnreferenced,
               update_rule as ondelete,
               delete_rule as onupdate,
                con.conname as object_id
               FROM (
                   SELECT
                     unnest(con1.conkey) AS parent,
                     unnest(con1.confkey) AS child,
                     con1.confrelid,
                     con1.conrelid,
                     cl_1.relname,
                   con1.conname
                   FROM
                     pg_class cl_1,
                     pg_namespace ns,
                     pg_constraint con1
                   WHERE
                     con1.contype = 'f'::"char"
                     AND cl_1.relnamespace = ns.oid
                     AND con1.conrelid = cl_1.oid
                     and nspname in (${schema})
              ) con,
                pg_attribute att,
                pg_class cl,
                pg_attribute att2,
                information_schema.referential_constraints rc
              WHERE
                att.attrelid = con.confrelid
                AND att.attnum = con.child
                AND cl.oid = con.confrelid
                AND att2.attrelid = con.conrelid
                AND att2.attnum = con.parent
                and rc.constraint_name= con.conname`)).rows;
        let relationsTemp: RelationTempInfo[] = <RelationTempInfo[]>[];
        response.forEach(resp => {
            let rels = relationsTemp.find(val => {
                return val.object_id == resp.object_id;
            });
            if (rels == undefined) {
                rels = <RelationTempInfo>{};
                rels.ownerColumnsNames = [];
                rels.referencedColumnsNames = [];
                rels.actionOnDelete = resp.ondelete;
                rels.actionOnUpdate = resp.onupdate;
                rels.object_id = resp.object_id;
                rels.ownerTable = resp.tablewithforeignkey;
                rels.referencedTable = resp.tablereferenced;
                relationsTemp.push(rels);
            }
            rels.ownerColumnsNames.push(resp.foreignkeycolumn);
            rels.referencedColumnsNames.push(resp.foreignkeycolumnreferenced);
        });
        relationsTemp.forEach(relationTmp => {
            let ownerEntity = entities.find(entitity => {
                return entitity.EntityName == relationTmp.ownerTable;
            });
            if (!ownerEntity) {
                TomgUtils.LogFatalError(
                    `Relation between tables ${relationTmp.ownerTable} and ${
                        relationTmp.referencedTable
                    } didn't found entity model ${relationTmp.ownerTable}.`
                );
                return;
            }
            let referencedEntity = entities.find(entitity => {
                return entitity.EntityName == relationTmp.referencedTable;
            });
            if (!referencedEntity) {
                TomgUtils.LogFatalError(
                    `Relation between tables ${relationTmp.ownerTable} and ${
                        relationTmp.referencedTable
                    } didn't found entity model ${relationTmp.referencedTable}.`
                );
                return;
            }
            let ownerColumn = ownerEntity.Columns.find(column => {
                return column.name == relationTmp.ownerColumnsNames[0];
            });
            if (!ownerColumn) {
                TomgUtils.LogFatalError(
                    `Relation between tables ${relationTmp.ownerTable} and ${
                        relationTmp.referencedTable
                    } didn't found entity column ${
                        relationTmp.ownerTable
                    }.${ownerColumn}.`
                );
                return;
            }
            let relatedColumn = referencedEntity.Columns.find(column => {
                return column.name == relationTmp.referencedColumnsNames[0];
            });
            if (!relatedColumn) {
                TomgUtils.LogFatalError(
                    `Relation between tables ${relationTmp.ownerTable} and ${
                        relationTmp.referencedTable
                    } didn't found entity column ${
                        relationTmp.referencedTable
                    }.${relatedColumn}.`
                );
                return;
            }
            let ownColumn: ColumnInfo = ownerColumn;
            let isOneToMany: boolean;
            isOneToMany = false;
            let index = ownerEntity.Indexes.find(index => {
                return (
                    index.isUnique &&
                    index.columns.some(col => {
                        return col.name == ownerColumn!.name;
                    })
                );
            });
            if (!index) {
                isOneToMany = true;
            } else {
                isOneToMany = false;
            }
            let ownerRelation = new RelationInfo();
            let columnName =
                ownerEntity.EntityName.toLowerCase() + (isOneToMany ? "s" : "");
            if (
                referencedEntity.Columns.filter(filterVal => {
                    return filterVal.name == columnName;
                }).length > 0
            ) {
                for (let i = 2; i <= ownerEntity.Columns.length; i++) {
                    columnName =
                        ownerEntity.EntityName.toLowerCase() +
                        (isOneToMany ? "s" : "") +
                        i.toString();
                    if (
                        referencedEntity.Columns.filter(filterVal => {
                            return filterVal.name == columnName;
                        }).length == 0
                    )
                        break;
                }
            }
            ownerRelation.actionOnDelete = relationTmp.actionOnDelete;
            ownerRelation.actionOnUpdate = relationTmp.actionOnUpdate;
            ownerRelation.isOwner = true;
            ownerRelation.relatedColumn = relatedColumn.name.toLowerCase();
            ownerRelation.relatedTable = relationTmp.referencedTable;
            ownerRelation.ownerTable = relationTmp.ownerTable;
            ownerRelation.ownerColumn = columnName;
            ownerRelation.relationType = isOneToMany ? "ManyToOne" : "OneToOne";
            ownerColumn.relations.push(ownerRelation);
            if (isOneToMany) {
                let col = new ColumnInfo();
                col.name = columnName;
                let referencedRelation = new RelationInfo();
                col.relations.push(referencedRelation);
                referencedRelation.actionondelete = relationTmp.actionOnDelete;
                referencedRelation.actiononupdate = relationTmp.actionOnUpdate;
                referencedRelation.isOwner = false;
                referencedRelation.relatedColumn = ownerColumn.name;
                referencedRelation.relatedTable = relationTmp.ownerTable;
                referencedRelation.ownerTable = relationTmp.referencedTable;
                referencedRelation.ownerColumn = relatedColumn.name.toLowerCase();
                referencedRelation.relationType = "OneToMany";
                referencedEntity.Columns.push(col);
            } else {
                let col = new ColumnInfo();
                col.name = columnName;
                let referencedRelation = new RelationInfo();
                col.relations.push(referencedRelation);
                referencedRelation.actionondelete = relationTmp.actionOnDelete;
                referencedRelation.actiononupdate = relationTmp.actionOnUpdate;
                referencedRelation.isOwner = false;
                referencedRelation.relatedColumn = ownerColumn.name;
                referencedRelation.relatedTable = relationTmp.ownerTable;
                referencedRelation.ownerTable = relationTmp.referencedTable;
                referencedRelation.ownerColumn = relatedColumn.name.toLowerCase();
                referencedRelation.relationType = "OneToOne";

                referencedEntity.Columns.push(col);
            }
        });
        return entities;
    }

    async DisconnectFromServer() {
        if (this.Connection) {
            let promise = new Promise<boolean>((resolve, reject) => {
                this.Connection.end(err => {
                    if (!err) {
                        //Connection successfull
                        resolve(true);
                    } else {
                        TomgUtils.LogFatalError(
                            "Error connecting to Postgres Server.",
                            false,
                            err.message
                        );
                        reject(err);
                    }
                });
            });
            await promise;
        }
    }

    async ConnectToServer(
        database: string,
        server: string,
        port: number,
        user: string,
        password: string,
        ssl: boolean
    ) {
        this.Connection = new PG.Client({
            database: database,
            host: server,
            port: port,
            user: user,
            password: password,
            ssl: ssl
        });

        let promise = new Promise<boolean>((resolve, reject) => {
            this.Connection.connect(err => {
                if (!err) {
                    //Connection successfull
                    resolve(true);
                } else {
                    TomgUtils.LogFatalError(
                        "Error connecting to Postgres Server.",
                        false,
                        err.message
                    );
                    reject(err);
                }
            });
        });

        await promise;
    }

    async CreateDB(dbName: string) {
        let resp = await this.Connection.query(`CREATE DATABASE ${dbName}; `);
    }
    async UseDB(dbName: string) {
        let resp = await this.Connection.query(`USE ${dbName}; `);
    }
    async DropDB(dbName: string) {
        let resp = await this.Connection.query(`DROP DATABASE ${dbName}; `);
    }
    async CheckIfDBExists(dbName: string): Promise<boolean> {
        let resp = await this.Connection.query(
            `SELECT datname FROM pg_database  WHERE datname  ='${dbName}' `
        );
        return resp.rowCount > 0;
    }
}
