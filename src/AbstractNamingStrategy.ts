import { Relation } from "./models/Relation";
import { Entity } from "./models/Entity";
import { Column } from "./models/Column";

export default abstract class AbstractNamingStrategy {
    public abstract relationName(relation: Relation, owner: Entity): string;

    public abstract entityName(entityName: string, entity?: Entity): string;

    public abstract columnName(columnName: string, column?: Column): string;
}
