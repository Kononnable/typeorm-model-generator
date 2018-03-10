import {request} from 'https';
import {promisify} from 'util';
import {AbstractDriver} from './AbstractDriver';
import {ColumnInfo} from './../models/ColumnInfo';
import {EntityInfo} from './../models/EntityInfo';
import {RelationInfo} from './../models/RelationInfo';
import {DatabaseModel} from './../models/DatabaseModel';
import * as TomgUtils from './../Utils';

export class OracleDriver extends AbstractDriver {
    Oracle: any;
    constructor() {
        super();
        try {
            this.Oracle = require("oracledb");
        } catch (error) {
            TomgUtils.LogFatalError("", false, error);
            throw error;
        }
    }

    async GetAllTables(schema: string): Promise<EntityInfo[]> {
        let response: any[][] = (await this.Connection.execute(
            ` SELECT TABLE_NAME FROM all_tables WHERE  owner = (select user from dual)`
        )).rows!;
        let ret: EntityInfo[] = <EntityInfo[]>[];
        response.forEach(val => {
            let ent: EntityInfo = new EntityInfo();
            ent.EntityName = val[0];
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
        let response: any[][] = (await this.Connection
            .execute(`SELECT TABLE_NAME, COLUMN_NAME, DATA_DEFAULT, NULLABLE, DATA_TYPE, DATA_LENGTH,
          DATA_PRECISION, DATA_SCALE, IDENTITY_COLUMN
         FROM USER_TAB_COLUMNS`)).rows!;

        entities.forEach(ent => {
            response
                .filter(filterVal => {
                    return filterVal[0] == ent.EntityName;
                })
                .forEach(resp => {
                    let colInfo: ColumnInfo = new ColumnInfo();
                    colInfo.name = resp[1];
                    colInfo.isNullable = resp[3] == "Y" ? true : false;
                    colInfo.isGenerated = resp[8] == "YES" ? true : false;
                    colInfo.columnType = colInfo.isGenerated
                        ? "PrimaryGeneratedColumn"
                        : "Column";
                    colInfo.default = resp[2];
                    colInfo.isDefaultType = false;
                    switch (resp[4].toLowerCase()) {
                        case "number":
                            colInfo.isDefaultType = true;
                            colInfo.tsType = "number";
                            colInfo.sqlType = "int";
                            colInfo.charMaxLength =
                                resp[5] > 0 ? resp[5] : null;
                            break;
                        case "varchar2":
                            colInfo.tsType = "number";
                            colInfo.sqlType = "smallint";
                            colInfo.charMaxLength =
                                resp[5] > 0 ? resp[5] : null;
                            break;
                        default:
                            TomgUtils.LogFatalError(
                                "Unknown column type:" + resp[4]
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
        let response: any[][] = (await this.Connection
            .execute(`SELECT ind.TABLE_NAME, ind.INDEX_NAME, col.COLUMN_NAME,ind.UNIQUENESS, CASE WHEN uc.CONSTRAINT_NAME IS NULL THEN 0 ELSE 1 END
        FROM USER_INDEXES ind
        JOIN USER_IND_COLUMNS col ON ind.INDEX_NAME=col.INDEX_NAME
        LEFT JOIN USER_CONSTRAINTS uc ON  uc.INDEX_NAME = ind.INDEX_NAME
        ORDER BY col.INDEX_NAME ASC ,col.COLUMN_POSITION ASC`)).rows!;

        entities.forEach(ent => {
            response
                .filter(filterVal => {
                    return filterVal[0] == ent.EntityName;
                })
                .forEach(resp => {
                    let indexInfo: IndexInfo = <IndexInfo>{};
                    let indexColumnInfo: IndexColumnInfo = <IndexColumnInfo>{};
                    if (
                        ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp[1];
                        }).length > 0
                    ) {
                        indexInfo = ent.Indexes.filter(filterVal => {
                            return filterVal.name == resp[1];
                        })[0];
                    } else {
                        indexInfo.columns = <IndexColumnInfo[]>[];
                        indexInfo.name = resp[1];
                        indexInfo.isUnique = resp[3] == "UNIQUE" ? true : false;
                        indexInfo.isPrimaryKey = resp[4] == 1 ? true : false;
                        ent.Indexes.push(indexInfo);
                    }
                    indexColumnInfo.name = resp[2];
                    //  indexColumnInfo.isIncludedColumn = resp.is_included_column == 1 ? true : false;
                    //  indexColumnInfo.isDescending = resp.is_descending_key == 1 ? true : false;
                    indexInfo.columns.push(indexColumnInfo);
                });
        });

        return entities;
    }

    async GetRelations(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]> {
        let response: any[][] = (await this.Connection
            .execute(`select owner.TABLE_NAME ownTbl,ownCol.POSITION,ownCol.COLUMN_NAME,
        child.TABLE_NAME,childCol.COLUMN_NAME,
        owner.DELETE_RULE,
        4,owner.CONSTRAINT_NAME
        from user_constraints owner
        join user_constraints child on owner.r_constraint_name=child.CONSTRAINT_NAME and child.constraint_type in ('P','U')
        JOIN USER_CONS_COLUMNS ownCol ON owner.CONSTRAINT_NAME = ownCol.CONSTRAINT_NAME
        JOIN USER_CONS_COLUMNS childCol ON child.CONSTRAINT_NAME = childCol.CONSTRAINT_NAME AND ownCol.POSITION=childCol.POSITION
        ORDER BY ownTbl ASC, owner.CONSTRAINT_NAME ASC, ownCol.POSITION ASC`))
            .rows!;

        let relationsTemp: RelationTempInfo[] = <RelationTempInfo[]>[];
        response.forEach(resp => {
            let rels = relationsTemp.find(val => {
                return val.object_id == resp[6];
            });
            if (rels == undefined) {
                rels = <RelationTempInfo>{};
                rels.ownerColumnsNames = [];
                rels.referencedColumnsNames = [];
                rels.actionOnDelete = resp[5];
                rels.actionOnUpdate = "NO ACTION";
                rels.object_id = resp[6];
                rels.ownerTable = resp[0];
                rels.referencedTable = resp[3];
                relationsTemp.push(rels);
            }
            rels.ownerColumnsNames.push(resp[2]);
            rels.referencedColumnsNames.push(resp[4]);
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
                ownerEntity.EntityName.toLowerCase() /* + (isOneToMany ? "s" : "")*/;
            if (
                referencedEntity.Columns.filter(filterVal => {
                    return filterVal.name == columnName;
                }).length > 0
            ) {
                for (let i = 2; i <= ownerEntity.Columns.length; i++) {
                    columnName =
                        ownerEntity.EntityName.toLowerCase() +
                        /*(isOneToMany ? "s" : "")*/ +
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
                referencedRelation.actionOnDelete = relationTmp.actionOnDelete;
                referencedRelation.actionOnUpdate = relationTmp.actionOnUpdate;
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
                referencedRelation.actionOnDelete = relationTmp.actionOnDelete;
                referencedRelation.actionOnUpdate = relationTmp.actionOnUpdate;
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
        if (this.Connection) await this.Connection.close();
    }

    private Connection: any /*Oracle.IConnection*/;
    async ConnectToServer(
        database: string,
        server: string,
        port: number,
        user: string,
        password: string,
        ssl: boolean
    ) {
        let config: any /*Oracle.IConnectionAttributes*/ = {
            user: user,
            password: password,
            // connectString: `${server}:${port}/ORCLCDB.localdomain/${database}`,
            connectString: `${server}:${port}/${database}`,
            externalAuth: ssl
        };

        let that = this;
        let promise = new Promise<boolean>((resolve, reject) => {
            this.Oracle.getConnection(config, function(err, connection) {
                if (!err) {
                    //Connection successfull
                    that.Connection = connection;
                    resolve(true);
                } else {
                    TomgUtils.LogFatalError(
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

    async CreateDB(dbName: string) {}
    async UseDB(dbName: string) {}
    async DropDB(dbName: string) {}
    async CheckIfDBExists(dbName: string): Promise<boolean> {
        return true;
    }
}
