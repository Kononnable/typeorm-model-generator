import { EntityInfo } from "./../models/EntityInfo";
import { DatabaseModel } from "./../models/DatabaseModel";
import * as TomgUtils from "./../Utils";
import { RelationInfo } from "../models/RelationInfo";
import { ColumnInfo } from "../models/ColumnInfo";
import {
    WithWidthColumnType,
    WithPrecisionColumnType,
    WithLengthColumnType
} from "./../../node_modules/typeorm/driver/types/ColumnTypes";

/**
 * AbstractDriver
 */
export abstract class AbstractDriver {
    ColumnTypesWithWidth: WithWidthColumnType[] = [
        "tinyint",
        "smallint",
        "mediumint",
        "int",
        "bigint"
    ];
    ColumnTypesWithPrecision: WithPrecisionColumnType[] = [
        "float",
        "double",
        "dec",
        "decimal",
        "numeric",
        "real",
        "double precision",
        "number",
        "datetime",
        "datetime2",
        "datetimeoffset",
        "time",
        "time with time zone",
        "time without time zone",
        "timestamp",
        "timestamp without time zone",
        "timestamp with time zone",
        "timestamp with local time zone"
    ];
    ColumnTypesWithLength: WithLengthColumnType[] = [
        "character varying",
        "varying character",
        "nvarchar",
        "character",
        "native character",
        "varchar",
        "char",
        "nchar",
        "varchar2",
        "nvarchar2",
        "raw",
        "binary",
        "varbinary"
    ];

    FindManyToManyRelations(dbModel: DatabaseModel) {
        let manyToManyEntities = dbModel.entities.filter(entity => {
            return (
                entity.Columns.filter(column => {
                    return (
                        column.relations.length == 1 &&
                        !column.relations[0].isOneToMany &&
                        column.relations[0].isOwner
                    );
                }).length == entity.Columns.length
            );
        });
        manyToManyEntities.map(entity => {
            let relations: RelationInfo[] = [];
            relations = entity.Columns.reduce((prev: RelationInfo[], curr) => {
                return prev.concat(curr.relations);
            }, relations);
            let namesOfRelatedTables = relations
                .map(v => v.relatedTable)
                .filter((v, i, s) => s.indexOf(v) == i);
            if (namesOfRelatedTables.length == 2) {
                let relatedTable1 = dbModel.entities.filter(
                    v => v.EntityName == namesOfRelatedTables[0]
                )[0];
                relatedTable1.Columns = relatedTable1.Columns.filter(
                    v =>
                        !v.name
                            .toLowerCase()
                            .startsWith(entity.EntityName.toLowerCase())
                );
                let relatedTable2 = dbModel.entities.filter(
                    v => v.EntityName == namesOfRelatedTables[1]
                )[0];
                relatedTable2.Columns = relatedTable2.Columns.filter(
                    v =>
                        !v.name
                            .toLowerCase()
                            .startsWith(entity.EntityName.toLowerCase())
                );
                dbModel.entities = dbModel.entities.filter(ent => {
                    return ent.EntityName != entity.EntityName;
                });

                let column1 = new ColumnInfo();
                column1.name = namesOfRelatedTables[1];
                let col1Rel = new RelationInfo();
                col1Rel.relatedTable = namesOfRelatedTables[1];
                col1Rel.relatedColumn = namesOfRelatedTables[1];
                col1Rel.relationType = "ManyToMany";
                col1Rel.isOwner = true;
                col1Rel.ownerColumn = namesOfRelatedTables[0];
                column1.relations.push(col1Rel);
                relatedTable1.Columns.push(column1);

                let column2 = new ColumnInfo();
                column2.name = namesOfRelatedTables[0];
                let col2Rel = new RelationInfo();
                col2Rel.relatedTable = namesOfRelatedTables[0];
                col2Rel.relatedColumn = namesOfRelatedTables[1];
                col2Rel.relationType = "ManyToMany";
                col2Rel.isOwner = false;
                column2.relations.push(col2Rel);
                relatedTable2.Columns.push(column2);
            }
        });
    }
    async GetDataFromServer(
        database: string,
        server: string,
        port: number,
        user: string,
        password: string,
        schema: string,
        ssl: boolean
    ): Promise<DatabaseModel> {
        let dbModel = <DatabaseModel>{};
        await this.ConnectToServer(database, server, port, user, password, ssl);
        let sqlEscapedSchema = "'" + schema.split(",").join("','") + "'";
        dbModel.entities = await this.GetAllTables(sqlEscapedSchema);
        await this.GetCoulmnsFromEntity(dbModel.entities, sqlEscapedSchema);
        await this.GetIndexesFromEntity(dbModel.entities, sqlEscapedSchema);
        dbModel.entities = await this.GetRelations(
            dbModel.entities,
            sqlEscapedSchema
        );
        await this.DisconnectFromServer();
        this.FindManyToManyRelations(dbModel);
        this.FindPrimaryColumnsFromIndexes(dbModel);
        return dbModel;
    }
    abstract async ConnectToServer(
        database: string,
        server: string,
        port: number,
        user: string,
        password: string,
        ssl: boolean
    );
    abstract async GetAllTables(schema: string): Promise<EntityInfo[]>;
    abstract async GetCoulmnsFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]>;
    abstract async GetIndexesFromEntity(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]>;
    abstract async GetRelations(
        entities: EntityInfo[],
        schema: string
    ): Promise<EntityInfo[]>;

    FindPrimaryColumnsFromIndexes(dbModel: DatabaseModel) {
        dbModel.entities.forEach(entity => {
            let primaryIndex = entity.Indexes.find(v => v.isPrimaryKey);

            entity.Columns.forEach(col => {
                if (
                    primaryIndex &&
                    primaryIndex.columns.some(cIndex => cIndex.name == col.name)
                )
                    col.isPrimary = true;
            });
            if (
                !entity.Columns.some(v => {
                    return v.isPrimary;
                })
            ) {
                TomgUtils.LogError(
                    `Table ${entity.EntityName} has no PK.`,
                    false
                );
                return;
            }
        });
    }
    abstract async DisconnectFromServer();

    abstract async CreateDB(dbName: string);
    abstract async DropDB(dbName: string);
    abstract async UseDB(dbName: string);
    abstract async CheckIfDBExists(dbName: string): Promise<boolean>;
}
