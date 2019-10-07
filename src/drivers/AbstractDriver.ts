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

    public static FindManyToManyRelations(dbModel: Entity[]) {
        let retVal = dbModel;
        const manyToManyEntities = retVal.filter(
            entity =>
                entity.columns.length ===
                    entity.columns.filter(c => c.primary).length &&
                entity.relations.length === 2 &&
                entity.relations.every(
                    v => v.relationOptions && v.relationType !== "ManyToMany"
                ) &&
                entity.relations[0].relatedTable !==
                    entity.relations[1].relatedTable
        );
        manyToManyEntities.forEach(junctionEntity => {
            const firstEntity = dbModel.find(
                v => v.tscName === junctionEntity.relations[0].relatedTable
            )!;
            const secondEntity = dbModel.find(
                v => v.tscName === junctionEntity.relations[1].relatedTable
            )!;

            const firstRelation = firstEntity.relations.find(
                v => v.relatedTable === junctionEntity.tscName
            )!;
            const secondRelation = secondEntity.relations.find(
                v => v.relatedTable === junctionEntity.tscName
            )!;

            firstRelation.relationType = "ManyToMany";
            secondRelation.relationType = "ManyToMany";
            firstRelation.relatedTable = secondEntity.tscName;
            secondRelation.relatedTable = firstEntity.tscName;

            firstRelation.fieldName = TomgUtils.findNameForNewField(
                secondEntity.tscName,
                firstEntity
            );
            secondRelation.fieldName = TomgUtils.findNameForNewField(
                firstEntity.tscName,
                secondEntity
            );
            firstRelation.relatedField = secondRelation.fieldName;
            secondRelation.relatedField = firstRelation.fieldName;

            firstRelation.joinTableOptions = {
                name: junctionEntity.sqlName,
                joinColumns: junctionEntity.relations[0].joinColumnOptions!.map(
                    (v, i) => {
                        return {
                            name: v.referencedColumnName,
                            referencedColumnName: junctionEntity.relations[1]
                                .joinColumnOptions![i].referencedColumnName
                        };
                    }
                ),
                inverseJoinColumns: junctionEntity.relations[1].joinColumnOptions!.map(
                    (v, i) => {
                        return {
                            name: v.referencedColumnName,
                            referencedColumnName: junctionEntity.relations[0]
                                .joinColumnOptions![i].referencedColumnName
                        };
                    }
                )
            };
            if (junctionEntity.database) {
                firstRelation.joinTableOptions.database =
                    junctionEntity.database;
            }
            if (junctionEntity.schema) {
                firstRelation.joinTableOptions.schema = junctionEntity.schema;
            }

            firstRelation.relationOptions = undefined;
            secondRelation.relationOptions = undefined;
            firstRelation.joinColumnOptions = undefined;
            secondRelation.joinColumnOptions = undefined;
            retVal = retVal.filter(ent => {
                return ent.tscName !== junctionEntity.tscName;
            });
        });
        return retVal;
    }

    public async GetDataFromServer(
        connectionOptions: IConnectionOptions
    ): Promise<Entity[]> {
        let dbModel = [] as Entity[];
        await this.ConnectToServer(connectionOptions);
        const sqlEscapedSchema = AbstractDriver.escapeCommaSeparatedList(
            connectionOptions.schemaName
        );
        dbModel = await this.GetAllTables(
            sqlEscapedSchema,
            connectionOptions.databaseName
        );
        await this.GetCoulmnsFromEntity(
            dbModel,
            sqlEscapedSchema,
            connectionOptions.databaseName
        );
        await this.GetIndexesFromEntity(
            dbModel,
            sqlEscapedSchema,
            connectionOptions.databaseName
        );
        AbstractDriver.FindPrimaryColumnsFromIndexes(dbModel);
        dbModel = await this.GetRelations(
            dbModel,
            sqlEscapedSchema,
            connectionOptions.databaseName
        );
        await this.DisconnectFromServer();
        dbModel = AbstractDriver.FindManyToManyRelations(dbModel);
        dbModel = AbstractDriver.FindFileImports(dbModel);
        return dbModel;
    }

    private static FindFileImports(dbModel: Entity[]) {
        dbModel.forEach(entity => {
            entity.relations.forEach(relation => {
                if (
                    !entity.fileImports.some(v => v === relation.relatedTable)
                ) {
                    entity.fileImports.push(relation.relatedTable);
                }
            });
        });
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
                schema: val.TABLE_SCHEMA,
                fileImports: []
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

            let ownerRelation: Relation | undefined;
            let relatedRelation: Relation | undefined;
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

                if (true) {
                    // TODO: RelationId
                    ownerEntity.columns = ownerEntity.columns.filter(
                        v =>
                            !relationTmp.ownerColumns.some(
                                u => u === v.tscName
                            ) || v.primary
                    );
                    relationTmp.relatedTable.columns = relationTmp.relatedTable.columns.filter(
                        v =>
                            !relationTmp.relatedColumns.some(
                                u => u === v.tscName
                            ) || v.primary
                    );
                }
                let fieldName = "";
                if (relationTmp.ownerColumns.length === 1) {
                    fieldName = TomgUtils.findNameForNewField(
                        ownerColumn.tscName,
                        ownerEntity
                    );
                } else {
                    fieldName = TomgUtils.findNameForNewField(
                        relationTmp.relatedTable.tscName,
                        ownerEntity
                    );
                }
                ownerRelation = {
                    fieldName,
                    relatedField: TomgUtils.findNameForNewField(
                        relationTmp.ownerTable.tscName,
                        relationTmp.relatedTable
                    ),
                    relationOptions: {
                        onDelete: relationTmp.onDelete,
                        onUpdate: relationTmp.onUpdate
                    },
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
                    relatedTable: relationTmp.relatedTable.tscName,
                    relationType: isOneToMany ? "ManyToOne" : "OneToOne"
                };
                relatedRelation = {
                    fieldName: ownerRelation.relatedField,
                    relatedField: ownerRelation.fieldName,
                    relatedTable: relationTmp.ownerTable.tscName,
                    // relationOptions: ownerRelation.relationOptions,
                    relationType: isOneToMany ? "OneToMany" : "OneToOne"
                };
            }
            if (ownerRelation) ownerEntity.relations.push(ownerRelation);
            if (relatedRelation)
                relationTmp.relatedTable.relations.push(relatedRelation);
        });
        return entities;
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
