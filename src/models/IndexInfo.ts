import IndexColumnInfo from "./IndexColumnInfo";

export default interface IndexInfo {
    name: string;
    columns: IndexColumnInfo[];
    isUnique: boolean;
    isPrimaryKey: boolean;
}
