export default interface RelationTempInfo {
    ownerTable: string;
    ownerColumnsNames: string[];
    referencedTable: string;
    referencedColumnsNames: string[];
    actionOnDelete:
        | "RESTRICT"
        | "CASCADE"
        | "SET NULL"
        | "DEFAULT"
        | "NO ACTION"
        | null;
    actionOnUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | "DEFAULT" | null;
    objectId: number | string;
}
