export class RelationInfo {
    [x: string]: any;

    isOwner: boolean;
    relationType: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany";
    relatedTable: string;
    relatedColumn: string;
    ownerTable: string;
    ownerColumn: string;
    actionOnDelete: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";
    actionOnUpdate: "RESTRICT" | "CASCADE" | "SET NULL" | "NO ACTION";

    get isOneToMany(): boolean {
        return this.relationType == "OneToMany";
    }
    get isManyToMany(): boolean {
        return this.relationType == "ManyToMany";
    }
}
