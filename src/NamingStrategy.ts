import { plural } from "pluralize";
import AbstractNamingStrategy from "./AbstractNamingStrategy";
import { Relation } from "./models/Relation";
import { RelationId } from "./models/RelationId";

import changeCase = require("change-case");

// TODO: Use function instead of class
// TODO: Allow users to change only specific functions instead of all of them(with logging if used standard or user function)
// TODO: Fix naming strategy relative path

/* eslint-disable class-methods-use-this */
export default class NamingStrategy extends AbstractNamingStrategy {
    public relationIdName(relationId: RelationId, relation: Relation): string {
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
        if (isRelationToMany) {
            columnName = plural(columnName);
        }

        return columnName;
    }

    public relationName(relation: Relation): string {
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
        if (isRelationToMany) {
            columnName = plural(columnName);
        }
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
