interface RelationTempInfo {
    ownerTable: string;
    ownerColumnsNames: string[];
    referencedTable: string;
    referencedColumnsNames: string[];
    actionOnDelete: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION';
    actionOnUpdate: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION';
    object_id: number | string;
}
