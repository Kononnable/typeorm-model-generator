interface RelationTempInfo {
    ownerTable: string;
    ownerColumnsNames: string[];
    referencedTable: string;
    referencedColumnsNames: string[];
    actionOnDelete: "RESTRICT" | "CASCADE" | "SET NULL" | null;
    actionOnUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | null;
    object_id: number | string;
}
