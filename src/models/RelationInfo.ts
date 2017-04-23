interface RelationInfo {
    isOwner: boolean,
    relationType: "OneToOne", "OneToMany", "ManyToOne"
    relatedTable: string,
    relatedColumn: string,
    actionOnDelete:"RESTRICT"|"CASCADE"|"SET NULL",
}