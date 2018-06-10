import { EntityInfo } from "./models/EntityInfo";

export abstract class NamingStrategy {
    abstract relationName(ownerEntity: EntityInfo, referencedEntity: EntityInfo, isOneToMany: boolean): string;

    abstract entityName(entityName: string): string;

    abstract columnName(columnName: string): string;
}
