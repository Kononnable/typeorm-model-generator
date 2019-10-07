import AbstractNamingStrategy from "./AbstractNamingStrategy";
import { Relation } from "./models/Relation";
import { Entity } from "./models/Entity";

import changeCase = require("change-case");

/* eslint-disable class-methods-use-this */
export default class NamingStrategy extends AbstractNamingStrategy {
    public relationName(relation: Relation, owner: Entity): string {
        const columnOldName = relation.fieldName;
        const isRelationToMany =
            relation.relationType === "OneToMany" ||
            relation.relationType === "ManyToMany";
        let columnName = changeCase.camelCase(columnOldName);

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

        if (
            relation.relationType !== "ManyToMany" &&
            columnOldName !== columnName
        ) {
            if (owner.columns.some(v => v.tscName === columnName)) {
                columnName += "_";
                for (let i = 2; i <= owner.columns.length; i++) {
                    columnName =
                        columnName.substring(
                            0,
                            columnName.length - i.toString().length
                        ) + i.toString();
                    if (
                        owner.columns.every(
                            v =>
                                v.tscName !== columnName ||
                                columnName === columnOldName
                        )
                    ) {
                        break;
                    }
                }
            }
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
