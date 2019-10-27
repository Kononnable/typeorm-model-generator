import { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults";
import { Entity } from "./models/Entity";
import IGenerationOptions from "./IGenerationOptions";
import AbstractNamingStrategy from "./AbstractNamingStrategy";
import NamingStrategy from "./NamingStrategy";
import * as TomgUtils from "./Utils";

export default function modelCustomizationPhase(
    dbModel: Entity[],
    generationOptions: IGenerationOptions,
    defaultValues: DataTypeDefaults
): Entity[] {
    let namingStrategy: AbstractNamingStrategy;
    if (
        generationOptions.customNamingStrategyPath &&
        generationOptions.customNamingStrategyPath !== ""
    ) {
        // eslint-disable-next-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
        const req = require(generationOptions.customNamingStrategyPath);
        namingStrategy = new req.NamingStrategy();
    } else {
        namingStrategy = new NamingStrategy();
    }
    let retVal = applyNamingStrategy(namingStrategy, dbModel);
    retVal = addImportsAndGenerationOptions(retVal, generationOptions);
    retVal = removeColumnDefaultProperties(retVal, defaultValues);
    return retVal;
}
function removeColumnDefaultProperties(
    dbModel: Entity[],
    defaultValues: DataTypeDefaults
): Entity[] {
    if (!defaultValues) {
        return dbModel;
    }
    dbModel.forEach(entity => {
        entity.columns.forEach(column => {
            const defVal = defaultValues[column.tscType];
            if (defVal) {
                if (
                    column.options.length &&
                    defVal.length &&
                    column.options.length === defVal.length
                ) {
                    column.options.length = undefined;
                }
                if (
                    column.options.precision &&
                    defVal.precision &&
                    column.options.precision === defVal.precision &&
                    column.options.scale &&
                    defVal.scale &&
                    column.options.scale === defVal.scale
                ) {
                    column.options.precision = undefined;
                    column.options.scale = undefined;
                }
                if (
                    column.options.width &&
                    defVal.width &&
                    column.options.width === defVal.width
                ) {
                    column.options.width = undefined;
                }
            }
        });
    });
    return dbModel;
}
function addImportsAndGenerationOptions(
    dbModel: Entity[],
    generationOptions: IGenerationOptions
): Entity[] {
    dbModel.forEach(entity => {
        entity.relations.forEach(relation => {
            if (generationOptions.lazy) {
                if (!relation.relationOptions) {
                    relation.relationOptions = {};
                }
                relation.relationOptions.lazy = true;
            }
        });
        if (generationOptions.skipSchema) {
            entity.schema = undefined;
            entity.database = undefined;
        }
        if (generationOptions.activeRecord) {
            entity.activeRecord = true;
        }
        if (generationOptions.generateConstructor) {
            entity.generateConstructor = true;
        }
    });
    return dbModel;
}

function applyNamingStrategy(
    namingStrategy: AbstractNamingStrategy,
    dbModel: Entity[]
): Entity[] {
    let retVal = changeRelationNames(dbModel);
    retVal = changeRelationIdNames(retVal);
    retVal = changeEntityNames(retVal);
    retVal = changeColumnNames(retVal);
    return retVal;

    function changeRelationIdNames(model: Entity[]): Entity[] {
        model.forEach(entity => {
            entity.relationIds.forEach(relationId => {
                const oldName = relationId.fieldName;
                const relation = entity.relations.find(
                    v => v.fieldName === relationId.relationField
                )!;
                let newName = namingStrategy.relationIdName(
                    relationId,
                    relation,
                    entity
                );
                newName = TomgUtils.findNameForNewField(
                    newName,
                    entity,
                    oldName
                );
                entity.indices.forEach(index => {
                    index.columns = index.columns.map(column2 =>
                        column2 === oldName ? newName : column2
                    );
                });

                relationId.fieldName = newName;
            });
        });
        return dbModel;
    }

    function changeRelationNames(model: Entity[]): Entity[] {
        model.forEach(entity => {
            entity.relations.forEach(relation => {
                const oldName = relation.fieldName;
                let newName = namingStrategy.relationName(relation, entity);
                newName = TomgUtils.findNameForNewField(
                    newName,
                    entity,
                    oldName
                );

                const relatedEntity = model.find(
                    v => v.tscName === relation.relatedTable
                )!;
                const relation2 = relatedEntity.relations.find(
                    v => v.fieldName === relation.relatedField
                )!;

                entity.relationIds
                    .filter(v => v.relationField === oldName)
                    .forEach(v => {
                        v.relationField = newName;
                    });

                relation.fieldName = newName;
                relation2.relatedField = newName;

                if (relation.relationOptions) {
                    entity.indices.forEach(ind => {
                        ind.columns.map(column2 =>
                            column2 === oldName ? newName : column2
                        );
                    });
                }
            });
        });
        return dbModel;
    }

    function changeColumnNames(model: Entity[]): Entity[] {
        model.forEach(entity => {
            entity.columns.forEach(column => {
                const oldName = column.tscName;
                let newName = namingStrategy.columnName(column.tscName, column);
                newName = TomgUtils.findNameForNewField(
                    newName,
                    entity,
                    oldName
                );
                entity.indices.forEach(index => {
                    index.columns = index.columns.map(column2 =>
                        column2 === oldName ? newName : column2
                    );
                });

                column.tscName = newName;
            });
        });
        return model;
    }
    function changeEntityNames(entities: Entity[]): Entity[] {
        entities.forEach(entity => {
            const newName = namingStrategy.entityName(entity.tscName, entity);
            entities.forEach(entity2 => {
                entity2.relations.forEach(relation => {
                    if (relation.relatedTable === entity.tscName) {
                        relation.relatedTable = newName;
                    }
                });
            });
            entity.tscName = newName;
        });
        return entities;
    }
}
