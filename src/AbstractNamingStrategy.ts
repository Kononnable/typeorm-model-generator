import RelationInfo from "./models/RelationInfo";
import EntityInfo from "./models/EntityInfo";
import ColumnInfo from "./models/ColumnInfo";

export default abstract class AbstractNamingStrategy {
    public abstract relationName(
        columnName: string,
        relation: RelationInfo,
        dbModel: EntityInfo[]
    ): string;

    public abstract entityName(entityName: string, entity?: EntityInfo): string;

    public abstract columnName(columnName: string, column?: ColumnInfo): string;
}
