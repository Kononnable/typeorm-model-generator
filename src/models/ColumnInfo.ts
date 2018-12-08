import { RelationInfo } from "./RelationInfo";

export class ColumnInfo {
    public tsName: string = "";
    public sqlName: string = "";
    public default: string | null = null;
    public is_nullable: boolean = false;
    public is_unique: boolean = false;
    public ts_type:
        | "number"
        | "string"
        | "boolean"
        | "Date"
        | "Buffer"
        | "Object"
        | "string | Object"
        | "string | string[]"
        | "any";
    public sql_type: string;
    public lenght: number | null = null;
    public width: number | null = null;
    public isPrimary: boolean = false;
    public is_generated: boolean = false;
    public is_array: boolean = false;
    public numericPrecision: number | null = null;
    public numericScale: number | null = null;
    public enumOptions: string | null = null;
    public relations: RelationInfo[];
    constructor() {
        this.relations = [];
    }
}
