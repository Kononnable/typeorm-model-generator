import { IndexColumnInfo } from "./IndexColumnInfo";

export interface IndexInfo {
    name: string;
    columns: IndexColumnInfo[];
    isUnique: boolean;
    isPrimaryKey: boolean;
}
