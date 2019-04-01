export class RelationInfo {
    public isOwner: boolean;
    public relationType: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany";
    public relatedTable: string;
    public relatedColumn: string;
    public ownerTable: string;
    public ownerColumn: string;
    public actionOnDelete:
        | "RESTRICT"
        | "CASCADE"
        | "SET NULL"
        | "DEFAULT"
        | "NO ACTION"
        | null;
    public actionOnUpdate:
        | "RESTRICT"
        | "CASCADE"
        | "SET NULL"
        | "DEFAULT"
        | null;
    public relationIdField: boolean = false;

    get isOneToMany(): boolean {
        return this.relationType === "OneToMany";
    }
    get isManyToMany(): boolean {
        return this.relationType === "ManyToMany";
    }
    get isOneToOne(): boolean {
        return this.relationType === "OneToOne";
    }
    get isManyToOne(): boolean {
        return this.relationType === "ManyToOne";
    }
}
