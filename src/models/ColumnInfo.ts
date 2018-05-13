import { RelationInfo } from "./RelationInfo";

export class ColumnInfo {
    name: string = "";
    default: string | null = null;
    is_nullable: boolean = false;
    is_unique: boolean = false;
    ts_type:
        | "number"
        | "string"
        | "boolean"
        | "Date"
        | "Buffer"
        | "Object"
        | "string | Object"
        | "string | string[]"
        | "any";
    sql_type: string;
    lenght: number | null = null;
    width: number | null = null;
    isPrimary: boolean = false;
    is_generated: boolean = false;
    numericPrecision: number | null = null;
    numericScale: number | null = null;
    enumOptions: string | null = null;
    relations: RelationInfo[];

    constructor() {
        this.relations = [];
    }
}
