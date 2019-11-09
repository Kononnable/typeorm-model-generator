export default class RelationInfo {
    public isOwner: boolean;

    public relationType: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany";

    public relatedTable: string;

    public relatedColumn: string;

    public ownerTable: string;

    public ownerColumn: string;

    public joinColumn?: string;

    public inverseJoinColumn?: string;

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

    public get isOneToMany(): boolean {
        return this.relationType === "OneToMany";
    }

    public get isManyToMany(): boolean {
        return this.relationType === "ManyToMany";
    }

    public get isOneToOne(): boolean {
        return this.relationType === "OneToOne";
    }

    public get isManyToOne(): boolean {
        return this.relationType === "ManyToOne";
    }
}
