interface RelationInfo{
    ownerTable:string,
    ownerColumnsNames:string[],
    referencedTableName:string,
    referencedColumnsNames:string[],
    actionOnDelete:"RESTRICT"|"CASCADE"|"SET NULL",
    object_id:number
}