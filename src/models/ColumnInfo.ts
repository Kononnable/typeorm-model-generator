import { RelationInfo } from "./RelationInfo";

export class ColumnInfo {
    public tsName: string = "";
    public sqlName: string = "";
    public default: string | null = null;
    public isNullable: boolean = false;
    public isUnique: boolean = false;
    public tsType:
        | "number"
        | "string"
        | "boolean"
        | "Date"
        | "Buffer"
        | "Object"
        | "string | Object"
        | "string | string[]"
        | "any";
    public sqlType: string;
    public lenght: number | null = null;
    public width: number | null = null;
    public isPrimary: boolean = false;
    public isGenerated: boolean = false;
    public isArray: boolean = false;
    public numericPrecision: number | null = null;
    public numericScale: number | null = null;
    public enumOptions: string | null = null;
    public relations: RelationInfo[];
    constructor() {
        this.relations = [];
    }
}
