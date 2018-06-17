import { RelationInfo } from "./models/RelationInfo";
import { DatabaseModel } from "./models/DatabaseModel";

export abstract class AbstractNamingStrategy {
    abstract relationName(columnName: string, relation: RelationInfo, dbModel: DatabaseModel): string;

    abstract entityName(entityName: string): string;

    abstract columnName(columnName: string): string;
}
