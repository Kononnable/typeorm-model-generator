import * as TypeormDriver from "typeorm/driver/oracle/OracleDriver";
import { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults";
import * as TomgUtils from "../Utils";
import AbstractDriver from "./AbstractDriver";
import EntityInfo from "../models/EntityInfo";
import ColumnInfo from "../models/ColumnInfo";
import IndexInfo from "../models/IndexInfo";
import IndexColumnInfo from "../models/IndexColumnInfo";
import RelationTempInfo from "../models/RelationTempInfo";
import IConnectionOptions from "../IConnectionOptions";

export default class OracleDriver extends AbstractDriver {
    public defaultValues: DataTypeDefaults = new TypeormDriver.OracleDriver({
        options: undefined
    } as any).dataTypeDefaults;

    public readonly standardPort = 1521;

    public readonly standardUser = "SYS";

    public readonly standardSchema = "";

    public Oracle: any;

    private Connection: any /* Oracle.IConnection */;

    public constructor() {
        super();
        try {
            // eslint-disable-next-line import/no-extraneous-dependencies, global-require, import/no-unresolved
            this.Oracle = require("oracledb");
            this.Oracle.outFormat = this.Oracle.OBJECT;
        } catch (error) {
            TomgUtils.LogError("", false, error);
            throw error;
        }
    }

    public GetAllTablesQuery = async () => {
        const response: {
            TABLE_SCHEMA: string;
            TABLE_NAME: string;
            DB_NAME: string;
        }[] = (await this.Connection.execute(
            ` SELECT NULL AS TABLE_SCHEMA, TABLE_NAME, NULL AS DB_NAME FROM all_tables WHERE  owner = (select user from dual)`
        )).rows!;
        return response;
    };

    public async GetCoulmnsFromEntity(
        entities: EntityInfo[]
    ): Promise<EntityInfo[]> {
        const response: {
            TABLE_NAME: string;
            COLUMN_NAME: string;
            DATA_DEFAULT: string;
            NULLABLE: string;
            DATA_TYPE: string;
            DATA_LENGTH: number;
            DATA_PRECISION: number;
            DATA_SCALE: number;
            IDENTITY_COLUMN: string;
            IS_UNIQUE: number;
        }[] = (await this.Connection
            .execute(`SELECT utc.TABLE_NAME, utc.COLUMN_NAME, DATA_DEFAULT, NULLABLE, DATA_TYPE, DATA_LENGTH,
            DATA_PRECISION, DATA_SCALE, IDENTITY_COLUMN,
            (select count(*) from USER_CONS_COLUMNS ucc
             JOIN USER_CONSTRAINTS uc ON  uc.CONSTRAINT_NAME = ucc.CONSTRAINT_NAME and uc.CONSTRAINT_TYPE='U'
            where ucc.column_name = utc.COLUMN_NAME AND ucc.table_name = utc.TABLE_NAME) IS_UNIQUE
           FROM USER_TAB_COLUMNS utc`)).rows!;

        entities.forEach(ent => {
            response
                .filter(filterVal => filterVal.TABLE_NAME === ent.tsEntityName)
                .forEach(resp => {
                    const colInfo: ColumnInfo = new ColumnInfo();
                    colInfo.tsName = resp.COLUMN_NAME;
                    colInfo.options.name = resp.COLUMN_NAME;
                    colInfo.options.nullable = resp.NULLABLE === "Y";
                    colInfo.options.generated = resp.IDENTITY_COLUMN === "YES";
                    colInfo.options.default =
                        !resp.DATA_DEFAULT || resp.DATA_DEFAULT.includes('"')
                            ? null
                            : OracleDriver.ReturnDefaultValueFunction(
                                  resp.DATA_DEFAULT
                              );
                    colInfo.options.unique = resp.IS_UNIQUE > 0;
                    const DATA_TYPE = resp.DATA_TYPE.replace(/\([0-9]+\)/g, "");
                    colInfo.options.type = DATA_TYPE.toLowerCase() as any;
                    switch (DATA_TYPE.toLowerCase()) {
                        case "char":
                            colInfo.tsType = "string";
                            break;
                        case "nchar":
                            colInfo.tsType = "string";
                            break;
                        case "nvarchar2":
                            colInfo.tsType = "string";
                            break;
                        case "varchar2":
                            colInfo.tsType = "string";
                            break;
                        case "long":
                            colInfo.tsType = "string";
                            break;
                        case "raw":
                            colInfo.tsType = "Buffer";
                            break;
                        case "long raw":
                            colInfo.tsType = "Buffer";
                            break;
                        case "number":
                            colInfo.tsType = "number";
                            break;
                        case "numeric":
                            colInfo.tsType = "number";
                            break;
                        case "float":
                            colInfo.tsType = "number";
                            break;
                        case "dec":
                            colInfo.tsType = "number";
                            break;
                        case "decimal":
                            colInfo.tsType = "number";
                            break;
                        case "integer":
                            colInfo.tsType = "number";
                            break;
                        case "int":
                            colInfo.tsType = "number";
                            break;
                        case "smallint":
                            colInfo.tsType = "number";
                            break;
                        case "real":
                            colInfo.tsType = "number";
                            break;
                        case "double precision":
                            colInfo.tsType = "number";
                            break;
                        case "date":
                            colInfo.tsType = "Date";
                            break;
                        case "timestamp":
                            colInfo.tsType = "Date";
                            break;
                        case "timestamp with time zone":
                            colInfo.tsType = "Date";
                            break;
                        case "timestamp with local time zone":
                            colInfo.tsType = "Date";
                            break;
                        case "interval year to month":
                            colInfo.tsType = "string";
                            break;
                        case "interval day to second":
                            colInfo.tsType = "string";
                            break;
                        case "bfile":
                            colInfo.tsType = "Buffer";
                            break;
                        case "blob":
                            colInfo.tsType = "Buffer";
                            break;
                        case "clob":
                            colInfo.tsType = "string";
                            break;
                        case "nclob":
                            colInfo.tsType = "string";
                            break;
                        case "rowid":
                            colInfo.tsType = "number";
                            break;
                        case "urowid":
                            colInfo.tsType = "number";
                            break;
                        default:
                            TomgUtils.LogError(
                                `Unknown column type:${DATA_TYPE}`
                            );
                            break;
                    }
                    if (
                        this.ColumnTypesWithPrecision.some(
                            v => v === colInfo.options.type
                        )
                    ) {
                        colInfo.options.precision = resp.DATA_PRECISION;
                        colInfo.options.scale = resp.DATA_SCALE;
                    }
                    if (
                        this.ColumnTypesWithLength.some(
                            v => v === colInfo.options.type
                        )
                    ) {
                        colInfo.options.length =
                            resp.DATA_LENGTH > 0 ? resp.DATA_LENGTH : undefined;
                    }

                    if (colInfo.options.type) {
                        ent.Columns.push(colInfo);
                    }
                });
        });
        return entities;
    }

    public async GetIndexesFromEntity(
        entities: EntityInfo[]
    ): Promise<EntityInfo[]> {
        const response: {
            COLUMN_NAME: string;
            TABLE_NAME: string;
            INDEX_NAME: string;
            UNIQUENESS: string;
            ISPRIMARYKEY: number;
        }[] = (await this.Connection
            .execute(`SELECT ind.TABLE_NAME, ind.INDEX_NAME, col.COLUMN_NAME,ind.UNIQUENESS, CASE WHEN uc.CONSTRAINT_NAME IS NULL THEN 0 ELSE 1 END ISPRIMARYKEY
        FROM USER_INDEXES ind
        JOIN USER_IND_COLUMNS col ON ind.INDEX_NAME=col.INDEX_NAME
        LEFT JOIN USER_CONSTRAINTS uc ON  uc.INDEX_NAME = ind.INDEX_NAME
        ORDER BY col.INDEX_NAME ASC ,col.COLUMN_POSITION ASC`)).rows!;

        entities.forEach(ent => {
            response
                .filter(filterVal => filterVal.TABLE_NAME === ent.tsEntityName)
                .forEach(resp => {
                    let indexInfo: IndexInfo = {} as IndexInfo;
                    const indexColumnInfo: IndexColumnInfo = {} as IndexColumnInfo;
                    if (
                        ent.Indexes.filter(
                            filterVal => filterVal.name === resp.INDEX_NAME
                        ).length > 0
                    ) {
                        indexInfo = ent.Indexes.find(
                            filterVal => filterVal.name === resp.INDEX_NAME
                        )!;
                    } else {
                        indexInfo.columns = [] as IndexColumnInfo[];
                        indexInfo.name = resp.INDEX_NAME;
                        indexInfo.isUnique = resp.UNIQUENESS === "UNIQUE";
                        indexInfo.isPrimaryKey = resp.ISPRIMARYKEY === 1;
                        ent.Indexes.push(indexInfo);
                    }
                    indexColumnInfo.name = resp.COLUMN_NAME;
                    indexInfo.columns.push(indexColumnInfo);
                });
        });

        return entities;
    }

    public async GetRelations(entities: EntityInfo[]): Promise<EntityInfo[]> {
        const response: {
            OWNER_TABLE_NAME: string;
            OWNER_POSITION: string;
            OWNER_COLUMN_NAME: string;
            CHILD_TABLE_NAME: string;
            CHILD_COLUMN_NAME: string;
            DELETE_RULE: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
            CONSTRAINT_NAME: string;
        }[] = (await this.Connection
            .execute(`select owner.TABLE_NAME OWNER_TABLE_NAME,ownCol.POSITION OWNER_POSITION,ownCol.COLUMN_NAME OWNER_COLUMN_NAME,
        child.TABLE_NAME CHILD_TABLE_NAME ,childCol.COLUMN_NAME CHILD_COLUMN_NAME,
        owner.DELETE_RULE,
        owner.CONSTRAINT_NAME
        from user_constraints owner
        join user_constraints child on owner.r_constraint_name=child.CONSTRAINT_NAME and child.constraint_type in ('P','U')
        JOIN USER_CONS_COLUMNS ownCol ON owner.CONSTRAINT_NAME = ownCol.CONSTRAINT_NAME
        JOIN USER_CONS_COLUMNS childCol ON child.CONSTRAINT_NAME = childCol.CONSTRAINT_NAME AND ownCol.POSITION=childCol.POSITION
        ORDER BY OWNER_TABLE_NAME ASC, owner.CONSTRAINT_NAME ASC, OWNER_POSITION ASC`))
            .rows!;

        const relationsTemp: RelationTempInfo[] = [] as RelationTempInfo[];
        response.forEach(resp => {
            let rels = relationsTemp.find(
                val => val.objectId === resp.CONSTRAINT_NAME
            );
            if (rels === undefined) {
                rels = {} as RelationTempInfo;
                rels.ownerColumnsNames = [];
                rels.referencedColumnsNames = [];
                rels.actionOnDelete =
                    resp.DELETE_RULE === "NO ACTION" ? null : resp.DELETE_RULE;
                rels.actionOnUpdate = null;
                rels.objectId = resp.CONSTRAINT_NAME;
                rels.ownerTable = resp.OWNER_TABLE_NAME;
                rels.referencedTable = resp.CHILD_TABLE_NAME;
                relationsTemp.push(rels);
            }
            rels.ownerColumnsNames.push(resp.OWNER_COLUMN_NAME);
            rels.referencedColumnsNames.push(resp.CHILD_COLUMN_NAME);
        });
        const retVal = OracleDriver.GetRelationsFromRelationTempInfo(
            relationsTemp,
            entities
        );
        return retVal;
    }

    public async DisconnectFromServer() {
        if (this.Connection) {
            await this.Connection.close();
        }
    }

    public async ConnectToServer(connectionOptons: IConnectionOptions) {
        let config: any;
        if (connectionOptons.user === String(process.env.ORACLE_UsernameSys)) {
            config /* Oracle.IConnectionAttributes */ = {
                connectString: `${connectionOptons.host}:${connectionOptons.port}/${connectionOptons.databaseName}`,
                externalAuth: connectionOptons.ssl,
                password: connectionOptons.password,
                privilege: this.Oracle.SYSDBA,
                user: connectionOptons.user
            };
        } else {
            config /* Oracle.IConnectionAttributes */ = {
                connectString: `${connectionOptons.host}:${connectionOptons.port}/${connectionOptons.databaseName}`,
                externalAuth: connectionOptons.ssl,
                password: connectionOptons.password,
                user: connectionOptons.user
            };
        }
        const that = this;
        const promise = new Promise<boolean>((resolve, reject) => {
            this.Oracle.getConnection(config, (err, connection) => {
                if (!err) {
                    that.Connection = connection;
                    resolve(true);
                } else {
                    TomgUtils.LogError(
                        "Error connecting to Oracle Server.",
                        false,
                        err.message
                    );
                    reject(err);
                }
            });
        });

        await promise;
    }

    public async CreateDB(dbName: string) {
        await this.Connection.execute(
            `CREATE USER ${dbName} IDENTIFIED BY ${String(
                process.env.ORACLE_Password
            )}`
        );
        await this.Connection.execute(`GRANT CONNECT TO ${dbName}`);
    }

    // eslint-disable-next-line class-methods-use-this
    public async UseDB() {
        // not supported
    }

    public async DropDB(dbName: string) {
        await this.Connection.execute(`DROP USER ${dbName} CASCADE`);
    }

    public async CheckIfDBExists(dbName: string): Promise<boolean> {
        const x = await this.Connection.execute(
            `select count(*) as CNT from dba_users where username='${dbName.toUpperCase()}'`
        );
        return x.rows[0][0] > 0 || x.rows[0].CNT;
    }

    private static ReturnDefaultValueFunction(
        defVal: string | null
    ): string | null {
        let defaultVal = defVal;
        if (!defaultVal) {
            return null;
        }
        if (defaultVal.endsWith(" ")) {
            defaultVal = defaultVal.slice(0, -1);
        }
        if (defaultVal.startsWith(`'`)) {
            return `() => "${defaultVal}"`;
        }
        return `() => "${defaultVal}"`;
    }
}
