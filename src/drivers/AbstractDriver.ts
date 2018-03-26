import { EntityInfo } from "./../models/EntityInfo";
import { DatabaseModel } from "./../models/DatabaseModel";
import * as TomgUtils from "./../Utils";
import { RelationInfo } from "../models/RelationInfo";
import { ColumnInfo } from "../models/ColumnInfo";
import { ManyToMany } from "typeorm";
/**
 * AbstractDriver
 */
export abstract class AbstractDriver {
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
            //TODO: Composed keys
            if (relations.length == 2) {
                let relatedTable1 = dbModel.entities.filter(
                    v => v.EntityName == relations[0].relatedTable
                )[0];
                relatedTable1.Columns = relatedTable1.Columns.filter(
                    v => v.name != entity.EntityName
                );
                let relatedTable2 = dbModel.entities.filter(
                    v => v.EntityName == relations[1].relatedTable
                )[0];
                relatedTable2.Columns = relatedTable2.Columns.filter(
                    v => v.name != entity.EntityName
                );
                dbModel.entities = dbModel.entities.filter(ent => {
                    return ent.EntityName != entity.EntityName;
                });

                let column1 = new ColumnInfo();
                column1.name = relations[1].relatedTable;
                let col1Rel = new RelationInfo();
                col1Rel.relatedTable = relations[1].relatedTable;
                col1Rel.relatedColumn = relations[1].relatedTable;
                col1Rel.relationType = "ManyToMany";
                col1Rel.isOwner = true;
                col1Rel.ownerColumn = relations[0].relatedTable;
                column1.relations.push(col1Rel);
                relatedTable1.Columns.push(column1);

                let column2 = new ColumnInfo();
                column2.name = relations[0].relatedTable;
                let col2Rel = new RelationInfo();
                col2Rel.relatedTable = relations[0].relatedTable;
                col2Rel.relatedColumn = relations[1].relatedTable;
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
    abstract async DisconnectFromServer();

    abstract async CreateDB(dbName: string);
    abstract async DropDB(dbName: string);
    abstract async UseDB(dbName: string);
    abstract async CheckIfDBExists(dbName: string): Promise<boolean>;
}
