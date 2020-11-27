import * as NamingStrategy from "../../src/NamingStrategy";
import { RelationId } from "../../src/models/RelationId";
import { Relation } from "../../src/models/Relation";

export function relationIdName(
    relationId: RelationId,
    relation: Relation
): string {
    return `${NamingStrategy.relationIdName(relationId, relation)}`;
}

export function relationName(relation: Relation): string {
    return `${NamingStrategy.relationName(relation)}_A`;
}

export function entityName(oldEntityName: string): string {
    return `${NamingStrategy.entityName(oldEntityName)}_B`;
}

export function columnName(oldColumnName: string): string {
    return `${NamingStrategy.columnName(oldColumnName)}_C`;
}

export function fileName(oldFileName: string): string {
    return `${NamingStrategy.fileName(oldFileName)}_D`;
}
