import { NamingStrategy } from "./NamingStrategy";
import { RelationInfo } from "./models/RelationInfo";
import { DatabaseModel } from "./models/DatabaseModel";

export class DefaultNamingStrategy extends NamingStrategy {
    relationName(
        columnOldName:string,
        relation: RelationInfo,
        dbModel:DatabaseModel
    ): string {
        let isRelationToMany = relation.isOneToMany || relation.isManyToMany
        let ownerEntity = dbModel.entities.filter(v => {
            return v.EntityName==relation.ownerTable
        })[0]
        let referencedEntity = dbModel.entities.filter(v => {
            return v.EntityName == relation.relatedTable
        })[0]



        let columnName = columnOldName[0].toLowerCase()+ columnOldName.substring(1,columnOldName.length);
        if ( columnName.endsWith("id")) {
            columnName = columnName.substring(0, columnName.lastIndexOf("id"));
        }
        if (!isNaN(parseInt(columnName[columnName.length-1]))) {
            let num = columnName[columnName.length-1]
            columnName = columnName.substring(0, columnName.length - 1)
            columnName += (isRelationToMany ? "s" : "")+num.toString();
        } else {
            columnName += isRelationToMany ? "s" : "";
        }

        if (relation.relationType!="ManyToMany") {

        if (columnOldName!=columnName) {
            if (!relation.isOwner) {
                if (ownerEntity.Columns.some(v => v.tsName == columnName)) {
                    columnName = columnName + "_"
                    for (let i = 2; i <= ownerEntity.Columns.length; i++) {
                        columnName = columnName.substring(0, columnName.length - 1) + i.toString();
                        if (ownerEntity.Columns.every(v => v.tsName != columnName)) break;
                    }
                }
            } else {
                if (referencedEntity.Columns.some(v => v.tsName == columnName)) {
                    columnName = columnName + "_"
                    for (let i = 2; i <= referencedEntity.Columns.length; i++) {
                        columnName = columnName.substring(0, columnName.length - 1) + i.toString();
                        if (referencedEntity.Columns.every(v => v.tsName != columnName)) break;
                    }
                }
            }
        }
        }

        return columnName;
    }

    entityName(entityName: string): string {
        return entityName;
    }

    columnName(columnName: string): string {
        return columnName;
    }
}
