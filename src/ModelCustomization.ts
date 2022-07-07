import { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults";
import { DefaultNamingStrategy } from "typeorm/naming-strategy/DefaultNamingStrategy";
import { Entity } from "./models/Entity";
import IGenerationOptions from "./IGenerationOptions";
import * as NamingStrategy from "./NamingStrategy";
import * as TomgUtils from "./Utils";

export default function modelCustomizationPhase(
    dbModel: Entity[],
    generationOptions: IGenerationOptions,
    defaultValues: DataTypeDefaults
): Entity[] {
    const namingStrategy: typeof NamingStrategy = {
        enablePluralization: NamingStrategy.enablePluralization,
        columnName: NamingStrategy.columnName,
        entityName: NamingStrategy.entityName,
        relationIdName: NamingStrategy.relationIdName,
        relationName: NamingStrategy.relationName,
        fileName: NamingStrategy.fileName,
    };
    if (
        generationOptions.customNamingStrategyPath &&
        generationOptions.customNamingStrategyPath !== ""
    ) {
        // TODO: change form of logging
        const req = TomgUtils.requireLocalFile(
            generationOptions.customNamingStrategyPath
        ) as Partial<typeof NamingStrategy>;
        if (req.columnName) {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using custom naming strategy for column names.`
            );
            namingStrategy.columnName = req.columnName;
        } else {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using standard naming strategy for column names.`
            );
        }
        if (req.entityName) {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using custom naming strategy for entity names.`
            );
            namingStrategy.entityName = req.entityName;
        } else {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using standard naming strategy for entity names.`
            );
        }
        if (req.relationIdName) {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using custom naming strategy for relationId field names.`
            );
            namingStrategy.relationIdName = req.relationIdName;
        } else {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using standard naming strategy for relationId field names.`
            );
        }
        if (req.relationName) {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using custom naming strategy for relation field names.`
            );
            namingStrategy.relationName = req.relationName;
        } else {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using standard naming strategy for relation field names.`
            );
        }
        if (req.fileName) {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using custom naming strategy for entity file names.`
            );
            namingStrategy.fileName = req.fileName;
        } else {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using standard naming strategy for entity file names.`
            );
        }
        if (req.enablePluralization) {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using custom pluralization method for OneToMany, ManyToMany relation field names.`
            );
            namingStrategy.enablePluralization = req.enablePluralization;
        } else {
            console.log(
                `[${new Date().toLocaleTimeString()}] Using custom pluralization method for OneToMany, ManyToMany relation field names.`
            );
        }
    }
    namingStrategy.enablePluralization(generationOptions.pluralizeNames);
    let retVal = removeIndicesGeneratedByTypeorm(dbModel);
    retVal = removeColumnsInRelation(dbModel);
    retVal = applyNamingStrategy(namingStrategy, dbModel);
    retVal = addImportsAndGenerationOptions(retVal, generationOptions);
    retVal = removeColumnDefaultProperties(retVal, defaultValues);
    return retVal;
}
function removeIndicesGeneratedByTypeorm(dbModel: Entity[]): Entity[] {
    // TODO: Support typeorm CustomNamingStrategy
    const namingStrategy = new DefaultNamingStrategy();
    dbModel.forEach((entity) => {
        entity.indices = entity.indices.filter(
            (v) =>
                !(
                    v.name.startsWith(`sqlite_autoindex_`) ||
                    (v.primary && v.name === "PRIMARY")
                )
        );
        const primaryColumns = entity.columns
            .filter((v) => v.primary)
            .map((v) => v.tscName);
        entity.indices = entity.indices.filter(
            (v) =>
                !(
                    v.primary &&
                    v.name ===
                        namingStrategy.primaryKeyName(
                            entity.tscName,
                            primaryColumns
                        )
                )
        );
        entity.relations
            .filter((v) => v.joinColumnOptions)
            .forEach((rel) => {
                const columnNames = rel.joinColumnOptions!.map((v) => v.name);
                const idxName = namingStrategy.relationConstraintName(
                    entity.tscName,
                    columnNames
                );
                const fkName = namingStrategy.foreignKeyName(
                    entity.tscName,
                    columnNames
                );
                entity.indices = entity.indices.filter(
                    (v) => v.name !== idxName && v.name !== fkName
                );
            });
    });
    return dbModel;
}
function removeColumnsInRelation(dbModel: Entity[]): Entity[] {
    dbModel.forEach((entity) => {
        entity.columns = entity.columns.filter(
            (col) =>
                !col.isUsedInRelationAsOwner ||
                col.isUsedInRelationAsReferenced ||
                entity.indices.some((idx) =>
                    idx.columns.some((v) => v === col.tscName)
                ) ||
                col.primary
        );
    });
    return dbModel;
}
function removeColumnDefaultProperties(
    dbModel: Entity[],
    defaultValues: DataTypeDefaults
): Entity[] {
    if (!defaultValues) {
        return dbModel;
    }
    dbModel.forEach((entity) => {
        entity.columns.forEach((column) => {
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

function findFileImports(dbModel: Entity[]) {
    dbModel.forEach((entity) => {
        entity.relations.forEach((relation) => {
            if (
                relation.relatedTable !== entity.tscName &&
                !entity.fileImports.some(
                    (v) => v.entityName === relation.relatedTable
                )
            ) {
                let relatedTable = dbModel.find(
                    (related) => related.tscName == relation.relatedTable
                )!;
                entity.fileImports.push({
                    entityName: relatedTable.tscName,
                    fileName: relatedTable.fileName,
                });
            }
        });
    });
    return dbModel;
}

function addImportsAndGenerationOptions(
    dbModel: Entity[],
    generationOptions: IGenerationOptions
): Entity[] {
    dbModel = findFileImports(dbModel);
    dbModel.forEach((entity) => {
        entity.relations.forEach((relation) => {
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
    namingStrategy: typeof NamingStrategy,
    dbModel: Entity[]
): Entity[] {
    let retVal = changeRelationNames(dbModel);
    retVal = changeRelationIdNames(retVal);
    retVal = changeEntityNames(retVal);
    retVal = changeColumnNames(retVal);
    retVal = changeFileNames(retVal);
    return retVal;

    function changeRelationIdNames(model: Entity[]): Entity[] {
        model.forEach((entity) => {
            entity.relationIds.forEach((relationId) => {
                const oldName = relationId.fieldName;
                const relation = entity.relations.find(
                    (v) => v.fieldName === relationId.relationField
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
                entity.indices.forEach((index) => {
                    index.columns = index.columns.map((column2) =>
                        column2 === oldName ? newName : column2
                    );
                });

                relationId.fieldName = newName;
            });
        });
        return dbModel;
    }

    function changeRelationNames(model: Entity[]): Entity[] {
        model.forEach((entity) => {
            entity.relations.forEach((relation) => {
                const oldName = relation.fieldName;
                let newName = namingStrategy.relationName(relation, entity);
                newName = TomgUtils.findNameForNewField(
                    newName,
                    entity,
                    oldName
                );

                const relatedEntity = model.find(
                    (v) => v.tscName === relation.relatedTable
                )!;
                const relation2 = relatedEntity.relations.find(
                    (v) => v.fieldName === relation.relatedField
                )!;

                entity.relationIds
                    .filter((v) => v.relationField === oldName)
                    .forEach((v) => {
                        v.relationField = newName;
                    });

                relation.fieldName = newName;
                relation2.relatedField = newName;

                if (relation.relationOptions) {
                    entity.indices.forEach((ind) => {
                        ind.columns.map((column2) =>
                            column2 === oldName ? newName : column2
                        );
                    });
                }
            });
        });
        return dbModel;
    }

    function changeColumnNames(model: Entity[]): Entity[] {
        model.forEach((entity) => {
            entity.columns.forEach((column) => {
                const oldName = column.tscName;
                let newName = namingStrategy.columnName(column.tscName, column);
                newName = TomgUtils.findNameForNewField(
                    newName,
                    entity,
                    oldName
                );
                entity.indices.forEach((index) => {
                    index.columns = index.columns.map((column2) =>
                        column2 === oldName ? newName : column2
                    );
                });

                column.tscName = newName;
            });
        });
        return model;
    }
    function changeEntityNames(entities: Entity[]): Entity[] {
        entities.forEach((entity) => {
            const newName = namingStrategy.entityName(entity.tscName, entity);
            entities.forEach((entity2) => {
                entity2.relations.forEach((relation) => {
                    if (relation.relatedTable === entity.tscName) {
                        relation.relatedTable = newName;
                    }
                });
            });
            entity.tscName = newName;
            entity.fileName = newName;
        });
        return entities;
    }
    function changeFileNames(entities: Entity[]): Entity[] {
        entities.forEach((entity) => {
            entity.fileName = namingStrategy.fileName(entity.fileName);
        });
        return entities;
    }
}
