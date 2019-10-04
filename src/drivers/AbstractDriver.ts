import {
    WithLengthColumnType,
    WithPrecisionColumnType,
    WithWidthColumnType
} from "typeorm/driver/types/ColumnTypes";
import { JoinColumnOptions } from "typeorm";
import { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults";
import * as TomgUtils from "../Utils";
import EntityInfo from "../oldModels/EntityInfo";
import RelationInfo from "../oldModels/RelationInfo";
import ColumnInfo from "../oldModels/ColumnInfo";
import IConnectionOptions from "../IConnectionOptions";
import { Entity } from "../models/Entity";
import { RelationInternal } from "../models/RelationInternal";
import { Relation } from "../models/Relation";

export default abstract class AbstractDriver {
    public abstract standardPort: number;

    public abstract standardSchema: string;

    public abstract standardUser: string;

    public abstract defaultValues: DataTypeDefaults;

    public ColumnTypesWithWidth: WithWidthColumnType[] = [
        "tinyint",
        "smallint",
        "mediumint",
        "int",
        "bigint"
    ];

    public ColumnTypesWithPrecision: WithPrecisionColumnType[] = [
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

    public ColumnTypesWithLength: WithLengthColumnType[] = [
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

    public abstract GetAllTablesQuery: (
        schema: string,
        dbNames: string
    ) => Promise<
        {
            TABLE_SCHEMA: string;
            TABLE_NAME: string;
            DB_NAME: string;
        }[]
    >;

    public static FindManyToManyRelations(dbModel: EntityInfo[]) {
        let retval = dbModel;
        const manyToManyEntities = retval.filter(
            entity =>
                entity.Columns.filter(column => {
                    return (
                        column.relations.length === 1 &&
                        !column.relations[0].isOneToMany &&
                        column.relations[0].isOwner
                    );
                }).length === entity.Columns.length
        );
        manyToManyEntities.forEach(entity => {
            let relations: RelationInfo[] = [];
            relations = entity.Columns.reduce(
                (prev: RelationInfo[], curr) => prev.concat(curr.relations),
                relations
            );
            const namesOfRelatedTables = relations
                .map(v => v.relatedTable)
                .filter((v, i, s) => s.indexOf(v) === i);
            const [
                firstRelatedTable,
                secondRelatedTable
            ] = namesOfRelatedTables;

            if (namesOfRelatedTables.length === 2) {
                const relatedTable1 = retval.find(
                    v => v.tsEntityName === firstRelatedTable
                )!;
                relatedTable1.Columns = relatedTable1.Columns.filter(
                    v =>
                        !v.tsName
                            .toLowerCase()
                            .startsWith(entity.tsEntityName.toLowerCase())
                );
                const relatedTable2 = retval.find(
                    v => v.tsEntityName === namesOfRelatedTables[1]
                )!;
                relatedTable2.Columns = relatedTable2.Columns.filter(
                    v =>
                        !v.tsName
                            .toLowerCase()
                            .startsWith(entity.tsEntityName.toLowerCase())
                );
                retval = retval.filter(ent => {
                    return ent.tsEntityName !== entity.tsEntityName;
                });

                const column1 = new ColumnInfo();
                column1.tsName = secondRelatedTable;
                column1.options.name = entity.sqlEntityName;

                const col1Rel = new RelationInfo();
                col1Rel.relatedTable = secondRelatedTable;
                col1Rel.relatedColumn = secondRelatedTable;

                col1Rel.relationType = "ManyToMany";
                col1Rel.isOwner = true;
                col1Rel.ownerColumn = firstRelatedTable;

                column1.relations.push(col1Rel);
                relatedTable1.Columns.push(column1);

                const column2 = new ColumnInfo();
                column2.tsName = firstRelatedTable;

                const col2Rel = new RelationInfo();
                col2Rel.relatedTable = firstRelatedTable;
                col2Rel.relatedColumn = secondRelatedTable;

                col2Rel.relationType = "ManyToMany";
                col2Rel.isOwner = false;
                column2.relations.push(col2Rel);
                relatedTable2.Columns.push(column2);
            }
        });
        return retval;
    }

    public async GetDataFromServer(
        connectionOptons: IConnectionOptions
    ): Promise<Entity[]> {
        let dbModel = [] as Entity[];
        await this.ConnectToServer(connectionOptons);
        const sqlEscapedSchema = AbstractDriver.escapeCommaSeparatedList(
            connectionOptons.schemaName
        );
        dbModel = await this.GetAllTables(
            sqlEscapedSchema,
            connectionOptons.databaseName
        );
        await this.GetCoulmnsFromEntity(
            dbModel,
            sqlEscapedSchema,
            connectionOptons.databaseName
        );
        await this.GetIndexesFromEntity(
            dbModel,
            sqlEscapedSchema,
            connectionOptons.databaseName
        );
        dbModel = await this.GetRelations(
            dbModel,
            sqlEscapedSchema,
            connectionOptons.databaseName
        );
        await this.DisconnectFromServer();
        // dbModel = AbstractDriver.FindManyToManyRelations(dbModel);
        AbstractDriver.FindPrimaryColumnsFromIndexes(dbModel);
        return dbModel;
    }

    public abstract async ConnectToServer(connectionOptons: IConnectionOptions);

    public async GetAllTables(
        schema: string,
        dbNames: string
    ): Promise<Entity[]> {
        const response = await this.GetAllTablesQuery(schema, dbNames);
        const ret: Entity[] = [] as Entity[];
        response.forEach(val => {
            ret.push({
                columns: [],
                indices: [],
                relations: [],
                sqlName: val.TABLE_NAME,
                tscName: val.TABLE_NAME,
                database: dbNames.includes(",") ? val.DB_NAME : "",
                schema: val.TABLE_SCHEMA
            });
        });
        return ret;
    }

    public static GetRelationsFromRelationTempInfo(
        relationsTemp: RelationInternal[],
        entities: Entity[]
    ) {
        relationsTemp.forEach(relationTmp => {
            if (relationTmp.ownerColumns.length > 1) {
                const relatedTable = entities.find(
                    entity => entity.tscName === relationTmp.ownerTable.tscName
                )!;
                if (
                    relatedTable.columns.length !==
                    relationTmp.ownerColumns.length * 2
                ) {
                    TomgUtils.LogError(
                        `Relation between tables ${relationTmp.ownerTable.sqlName} and ${relationTmp.relatedTable.sqlName} wasn't generated correctly - complex relationships aren't supported yet.`,
                        false
                    );
                    return;
                }

                const secondRelation = relationsTemp.find(
                    relation =>
                        relation.ownerTable.tscName === relatedTable.tscName &&
                        relation.relatedTable.tscName !==
                            relationTmp.relatedTable.tscName
                )!;
                if (!secondRelation) {
                    TomgUtils.LogError(
                        `Relation between tables ${relationTmp.ownerTable.sqlName} and ${relationTmp.relatedTable.sqlName} wasn't generated correctly - complex relationships aren't supported yet.`,
                        false
                    );
                    return;
                }
            }

            const ownerEntity = entities.find(
                entity => entity.tscName === relationTmp.ownerTable.tscName
            );
            if (!ownerEntity) {
                TomgUtils.LogError(
                    `Relation between tables ${relationTmp.ownerTable.sqlName} and ${relationTmp.relatedTable.sqlName} didn't found entity model ${relationTmp.ownerTable.sqlName}.`
                );
                return;
            }
            const referencedEntity = entities.find(
                entity => entity.tscName === relationTmp.relatedTable.tscName
            );
            if (!referencedEntity) {
                TomgUtils.LogError(
                    `Relation between tables ${relationTmp.ownerTable.sqlName} and ${relationTmp.relatedTable.sqlName} didn't found entity model ${relationTmp.relatedTable.sqlName}.`
                );
                return;
            }
            for (
                let relationColumnIndex = 0;
                relationColumnIndex < relationTmp.ownerColumns.length;
                relationColumnIndex++
            ) {
                const ownerColumn = ownerEntity.columns.find(
                    column =>
                        column.tscName ===
                        relationTmp.ownerColumns[relationColumnIndex]
                );
                if (!ownerColumn) {
                    TomgUtils.LogError(
                        `Relation between tables ${relationTmp.ownerTable.sqlName} and ${relationTmp.relatedTable.sqlName} didn't found entity column ${relationTmp.ownerTable.sqlName}.${ownerColumn}.`
                    );
                    return;
                }
                const relatedColumn = referencedEntity.columns.find(
                    column =>
                        column.tscName ===
                        relationTmp.relatedColumns[relationColumnIndex]
                );
                if (!relatedColumn) {
                    TomgUtils.LogError(
                        `Relation between tables ${relationTmp.ownerTable.sqlName} and ${relationTmp.relatedTable.sqlName} didn't found entity column ${relationTmp.relatedTable.sqlName}.${relatedColumn}.`
                    );
                    return;
                }
                let isOneToMany: boolean;
                isOneToMany = false;
                const index = ownerEntity.indices.find(
                    ind =>
                        ind.options.unique &&
                        ind.columns.length === 1 &&
                        ind.columns[0] === ownerColumn!.tscName
                );
                isOneToMany = !index;

                const ownerRelation: Relation = {
                    fieldName: AbstractDriver.findNameForNewField(
                        relationTmp.relatedTable.tscName,
                        ownerEntity
                    ),
                    joinColumnOptions: relationTmp.ownerColumns.map(
                        (v, idx) => {
                            const retVal: JoinColumnOptions = {
                                name: v,
                                referencedColumnName:
                                    relationTmp.relatedColumns[idx]
                            };
                            return retVal;
                        }
                    ),
                    relatedField: AbstractDriver.findNameForNewField(
                        relationTmp.ownerTable.tscName,
                        relationTmp.relatedTable
                    ),
                    relatedTable: relationTmp.relatedTable.tscName,
                    relationOptions: {
                        onDelete: relationTmp.onDelete,
                        onUpdate: relationTmp.onUpdate
                    },
                    relationType: isOneToMany ? "OneToMany" : "OneToOne"
                };
                const relatedRelation: Relation = {
                    fieldName: ownerRelation.relatedField,
                    relatedField: ownerRelation.fieldName,
                    relatedTable: relationTmp.ownerTable.tscName,
                    relationOptions: ownerRelation.relationOptions,
                    relationType: isOneToMany ? "ManyToOne" : "OneToOne"
                };

                ownerEntity.relations.push(ownerRelation);
                relationTmp.relatedTable.relations.push(relatedRelation);
            }
        });
        return entities;
    }

    private static findNameForNewField(_fieldName: string, entity: Entity) {
        let fieldName = _fieldName;
        const validNameCondition =
            entity.columns.every(v => v.tscName !== fieldName) &&
            entity.relations.every(v => v.fieldName !== fieldName);
        if (validNameCondition) {
            fieldName += "_";
            for (
                let i = 2;
                i <= entity.columns.length + entity.relations.length;
                i++
            ) {
                fieldName =
                    fieldName.substring(
                        0,
                        fieldName.length - i.toString().length
                    ) + i.toString();
                if (validNameCondition) {
                    break;
                }
            }
        }
        return fieldName;
    }

    public abstract async GetCoulmnsFromEntity(
        entities: Entity[],
        schema: string,
        dbNames: string
    ): Promise<Entity[]>;

    public abstract async GetIndexesFromEntity(
        entities: Entity[],
        schema: string,
        dbNames: string
    ): Promise<Entity[]>;

    public abstract async GetRelations(
        entities: Entity[],
        schema: string,
        dbNames: string
    ): Promise<Entity[]>;

    public static FindPrimaryColumnsFromIndexes(dbModel: Entity[]) {
        dbModel.forEach(entity => {
            const primaryIndex = entity.indices.find(v => v.primary);
            entity.columns
                .filter(
                    col =>
                        primaryIndex &&
                        primaryIndex.columns.some(
                            cIndex => cIndex === col.tscName
                        )
                )
                .forEach(col => {
                    // eslint-disable-next-line no-param-reassign
                    col.primary = true;
                });
            if (
                !entity.columns.some(v => {
                    return !!v.primary;
                })
            ) {
                TomgUtils.LogError(`Table ${entity.tscName} has no PK.`, false);
            }
        });
    }

    public abstract async DisconnectFromServer();

    public abstract async CreateDB(dbName: string);

    public abstract async DropDB(dbName: string);

    public abstract async UseDB(dbName: string);

    public abstract async CheckIfDBExists(dbName: string): Promise<boolean>;

    // TODO: change name
    protected static escapeCommaSeparatedList(commaSeparatedList: string) {
        return `'${commaSeparatedList.split(",").join("','")}'`;
    }
}
