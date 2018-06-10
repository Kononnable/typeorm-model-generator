import { NamingStrategy } from "./NamingStrategy";
import { EntityInfo } from "./models/EntityInfo";

export class DefaultNamingStrategy extends NamingStrategy {
    relationName(
        ownerEntity: EntityInfo,
        referencedEntity: EntityInfo,
        isOneToMany: boolean
    ): string {
        let columnName = ownerEntity.EntityName.toLowerCase();
        if (columnName.endsWith("Id")) {
            columnName = columnName.substring(0, columnName.lastIndexOf("Id"));
        }
        columnName += isOneToMany ? "s" : "";
        if (
            referencedEntity.Columns.filter(filterVal => {
                return filterVal.tsName == columnName;
            }).length > 0
        ) {
            for (let i = 2; i <= ownerEntity.Columns.length; i++) {
                columnName = ownerEntity.EntityName.toLowerCase();
                if (columnName.endsWith("Id")) {
                    columnName = columnName.substring(
                        0,
                        columnName.lastIndexOf("Id")
                    );
                }
                columnName += (isOneToMany ? "s" : "") + i.toString();
                if (
                    referencedEntity.Columns.filter(filterVal => {
                        return filterVal.tsName == columnName;
                    }).length == 0
                )
                    break;
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
