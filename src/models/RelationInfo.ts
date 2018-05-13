export class RelationInfo {
    isOwner: boolean;
    relationType: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany";
    relatedTable: string;
    relatedColumn: string;
    ownerTable: string;
    ownerColumn: string;
    actionOnDelete: "RESTRICT" | "CASCADE" | "SET NULL" | null;
    actionOnUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | null;

    get isOneToMany(): boolean {
        return this.relationType == "OneToMany";
    }
    get isManyToMany(): boolean {
        return this.relationType == "ManyToMany";
    }
}
