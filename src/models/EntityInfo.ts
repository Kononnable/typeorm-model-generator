import {ColumnInfo} from './ColumnInfo';

export class EntityInfo {
    EntityName: string;
    Columns: ColumnInfo[];
    Imports: string[];
    UniqueImports: string[];
    Indexes: IndexInfo[];
    Schema: string;

    relationImports(): any {
        const imports: string[] = [];
        this.Columns.forEach(column => {
            column.relations.forEach(relation => {
                if (this.EntityName != relation.relatedTable) {
                    imports.push(relation.relatedTable);
                }
            });
        });
        this.UniqueImports = imports.filter((e, i, s) => i === s.indexOf(e));
    }
}
