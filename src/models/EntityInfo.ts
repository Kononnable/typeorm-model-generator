import { ColumnInfo } from "./ColumnInfo";

export class EntityInfo {
    public tsEntityName: string;
    public sqlEntityName: string;
    public Columns: ColumnInfo[];
    public Imports: string[];
    public UniqueImports: string[];
    public Indexes: IndexInfo[];
    public Schema: string;
    public GenerateConstructor: boolean;
    public IsActiveRecord: boolean;

    public relationImports() {
        const imports: string[] = [];
        this.Columns.forEach(column => {
            column.relations.forEach(relation => {
                if (this.tsEntityName !== relation.relatedTable) {
                    imports.push(relation.relatedTable);
                }
            });
        });
        this.UniqueImports = imports.filter(
            (elem, index, self) => index === self.indexOf(elem)
        );
    }
}
