import { ColumnInfo } from './ColumnInfo'
/**
 * EntityInfo
 */
export class EntityInfo {
    EntityName: string;
    Columns: ColumnInfo[];
    Indexes: IndexInfo[];

    relationImports(): any {
            var returnString = "";
            var imports: string[] = [];
            this.Columns.forEach((column) => {
                column.relations.forEach(
                    (relation) => {
                        if (this.EntityName!=relation.relatedTable)
                        imports.push(relation.relatedTable);
                    }
                )
            });
            imports.filter(function (elem, index, self) {
                return index == self.indexOf(elem);
            }).forEach((imp)=>{
                returnString+=`import {${imp}} from './${imp}'\n`
            })

            return returnString;
    }
  
}