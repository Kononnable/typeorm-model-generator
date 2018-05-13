import { ColumnInfo } from "./ColumnInfo";

export class EntityInfo {
    EntityName: string;
    Columns: ColumnInfo[];
    Imports: string[];
    UniqueImports: string[];
    Indexes: IndexInfo[];
    Schema: string;
    GenerateConstructor: boolean;

    relationImports(): any {
        var imports: string[] = [];
        this.Columns.forEach(column => {
            column.relations.forEach(relation => {
                if (this.EntityName != relation.relatedTable)
                    imports.push(relation.relatedTable);
            });
        });
        this.UniqueImports = imports.filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        });
    }
}
