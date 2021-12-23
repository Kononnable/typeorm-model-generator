import { EntitySchemaOptions } from "typeorm/entity-schema/EntitySchemaOptions";
import {
    ColumnType,
    EntitySchemaColumnOptions,
    EntitySchemaIndexOptions,
    EntitySchemaRelationOptions,
} from "typeorm";
import { RelationType } from "typeorm/metadata/types/RelationTypes";

import { Column } from "./models/Column";
import { Entity } from "./models/Entity";
import { Index } from "./models/Index";

import { Relation } from "./models/Relation";

type EntitySchemaColumnOptionsObj = {
    [key: string]: EntitySchemaColumnOptions;
};

type EntitySchemaRelationOptionsObj = {
    [key: string]: EntitySchemaRelationOptions;
};

function createSchemaColoumOptions(col: Column): EntitySchemaColumnOptionsObj {
    const {
        primary,
        generated,
        type,
        options,
        // default,
        // tscType,
        // tscName,
        // isUsedInRelationAsOwner,
        // isUsedInRelationAsReferenced,
    } = col;
    const val: EntitySchemaColumnOptions = {
        type: type as ColumnType,
        ...options,
        primary,
        generated,
    };
    return {
        [options.name]: val,
    };
}

function createSchemaIndexOptions(
    indices: Index[]
): EntitySchemaIndexOptions[] {
    return indices.map((index: Index) => {
        const entitySchemaIndexOptions: EntitySchemaIndexOptions = {
            name: index.name,
            columns: index.columns,
            unique: index.options.unique,
        };
        return entitySchemaIndexOptions;
    });
}

function createSchemaRelationOptions(
    relations: Relation[]
): EntitySchemaRelationOptionsObj {
    const entitySchemaRelationOptionsObj: EntitySchemaRelationOptionsObj = {};
    function pascalToHyphenSeparated(str: string) {
        return str
            .split(/(?=[A-Z])/)
            .map((s) => s.toLowerCase())
            .join("-");
    }
    relations.forEach((relation: Relation): void => {
        const {
            relationType,
            relatedTable,
            relatedField,
            fieldName,
            relationOptions,
            joinColumnOptions,
            joinTableOptions,
        } = relation;

        const relationKey =
            joinColumnOptions?.length && joinColumnOptions[0].name;

        if (relationKey) {
            Object.assign(entitySchemaRelationOptionsObj, {
                [`${relationKey}`]: {
                    type: pascalToHyphenSeparated(relationType) as RelationType,
                    target: relatedTable,
                    joinColumn: joinColumnOptions,
                    joinTable: joinTableOptions,
                } as EntitySchemaRelationOptions,
            });
        }
    });

    return entitySchemaRelationOptionsObj;
}

export default function createEntitySchemaConf(entity: Entity) {
    const {
        sqlName,
        columns,
        indices,
        database,
        schema,
        // tscName,
        // relationIds,
        relations,
    } = entity;

    const entitySchemaOptionsCols = {};

    const entitySchemaOptionsIndices: EntitySchemaIndexOptions[] =
        createSchemaIndexOptions(indices);

    const SchemaColoumOptionsArray: EntitySchemaColumnOptionsObj[] =
        columns.map(createSchemaColoumOptions);

    SchemaColoumOptionsArray.forEach((o) =>
        Object.assign(entitySchemaOptionsCols, o)
    );
    const entitySchemaOptions: EntitySchemaOptions<any> = {
        name: sqlName,
        tableName: sqlName,
        database,
        schema,
        columns: entitySchemaOptionsCols,
        indices: entitySchemaOptionsIndices,
        relations: createSchemaRelationOptions(relations),
    };
    return entitySchemaOptions;
}
