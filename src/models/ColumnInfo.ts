import { ColumnOptions } from "typeorm";
import { RelationInfo } from "./RelationInfo";

export class ColumnInfo {
    public options: ColumnOptions = {};
    public tsName: string = "";
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
    public relations: RelationInfo[] = [];
}
