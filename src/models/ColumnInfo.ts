/**
 * ColumnInfo
 */
export class ColumnInfo {
    name: string;
    default: string|null;
    is_nullable: boolean;
    ts_type: 'number' | 'string' | 'boolean';
    sql_type: "string" | "text" | "number" | "integer" | "int" | "smallint" | "bigint" |
    "float" | "double" | "decimal" | "date" | "time" | "datetime" | "boolean" | "json";
    char_max_lenght: number|null;
    isPrimary:boolean;
    numericPrecision:number|null;
    numericScale:number|null;
    relations:RelationInfo[];

    constructor() {
        this.relations=[];
    }

}


