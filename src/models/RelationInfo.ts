export class RelationInfo {
    isOwner: boolean
    relationType: "OneToOne" | "OneToMany" | "ManyToOne"
    relatedTable: string
    relatedColumn: string
    ownerTable: string
    ownerColumn: string
    actionOnDelete: "RESTRICT" | "CASCADE" | "SET NULL"
    actionOnUpdate: "RESTRICT" | "CASCADE" | "SET NULL"

    get isOneToMany(): boolean {
        return this.relationType == "OneToMany"
    }

}