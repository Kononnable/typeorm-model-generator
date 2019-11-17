import StandardNamingStrategy from "../../src/NamingStrategy";
import { RelationId } from "../../src/models/RelationId";
import { Relation } from "../../src/models/Relation";

/* eslint-disable class-methods-use-this */
export default class NamingStrategy extends StandardNamingStrategy {
    public relationIdName(relationId: RelationId, relation: Relation): string {
        return `${super.relationIdName(relationId, relation)}`;
    }

    public relationName(relation: Relation): string {
        return `${super.relationName(relation)}_A`;
    }

    public entityName(entityName: string): string {
        return `${super.entityName(entityName)}_B`;
    }

    public columnName(columnName: string): string {
        return `${super.columnName(columnName)}_C`;
    }
}

/* eslint-enable class-methods-use-this */
