interface RelationTempInfo{
    ownerTable:string,
    ownerColumnsNames:string[],
    referencedTable:string,
    referencedColumnsNames:string[],
    actionOnDelete:"RESTRICT"|"CASCADE"|"SET NULL",
    actionOnUpdate:"RESTRICT"|"CASCADE"|"SET NULL",
    object_id:number
}