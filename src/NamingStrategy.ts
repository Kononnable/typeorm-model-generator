import AbstractNamingStrategy from "./AbstractNamingStrategy";
import { Relation } from "./models/Relation";
import { Entity } from "./models/Entity";
import { RelationId } from "./models/RelationId";

import changeCase = require("change-case");

/* eslint-disable class-methods-use-this */
export default class NamingStrategy extends AbstractNamingStrategy {
    public relationIdName(
        relationId: RelationId,
        relation: Relation,
        owner: Entity
    ): string {
        const columnOldName = relationId.fieldName;

        const isRelationToMany =
            relation.relationType === "OneToMany" ||
            relation.relationType === "ManyToMany";
        let columnName = changeCase.camelCase(
            columnOldName.replace(/[0-9]$/, "")
        );

        if (!Number.isNaN(parseInt(columnName[columnName.length - 1], 10))) {
            columnName = columnName.substring(0, columnName.length - 1);
        }
        if (!Number.isNaN(parseInt(columnName[columnName.length - 1], 10))) {
            columnName = columnName.substring(0, columnName.length - 1);
        }
        columnName += isRelationToMany ? "s" : "";

        return columnName;
    }

    public relationName(relation: Relation, owner: Entity): string {
        const columnOldName = relation.fieldName;

        const isRelationToMany =
            relation.relationType === "OneToMany" ||
            relation.relationType === "ManyToMany";
        let columnName = changeCase.camelCase(
            columnOldName.replace(/[0-9]$/, "")
        );

        if (
            columnName.toLowerCase().endsWith("id") &&
            !columnName.toLowerCase().endsWith("guid")
        ) {
            columnName = columnName.substring(
                0,
                columnName.toLowerCase().lastIndexOf("id")
            );
        }
        if (!Number.isNaN(parseInt(columnName[columnName.length - 1], 10))) {
            columnName = columnName.substring(0, columnName.length - 1);
        }
        if (!Number.isNaN(parseInt(columnName[columnName.length - 1], 10))) {
            columnName = columnName.substring(0, columnName.length - 1);
        }
        columnName += isRelationToMany ? "s" : "";

        return columnName;
    }

    public entityName(entityName: string): string {
        return entityName;
    }

    public columnName(columnName: string): string {
        return columnName;
    }
}

/* eslint-enable class-methods-use-this */
