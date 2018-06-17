export class RelationInfo {
    isOwner: boolean;
    relationType: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany";
    relatedTable: string;
    relatedColumn: string;
    ownerTable: string;
    ownerColumn: string;
    actionOnDelete: "RESTRICT" | "CASCADE" | "SET NULL" | null;
    actionOnUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | null;
    relationIdField: boolean = false;

    get isOneToMany(): boolean {
        return this.relationType == "OneToMany";
    }
    get isManyToMany(): boolean {
        return this.relationType == "ManyToMany";
    }
    get isOneToOne(): boolean {
        return this.relationType == "OneToOne";
    }
    get isManyToOne(): boolean {
        return this.relationType == "OneToOne";
    }
}
