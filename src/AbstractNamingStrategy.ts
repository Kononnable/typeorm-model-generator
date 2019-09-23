import RelationInfo from "./oldModels/RelationInfo";
import EntityInfo from "./oldModels/EntityInfo";
import ColumnInfo from "./oldModels/ColumnInfo";

export default abstract class AbstractNamingStrategy {
    public abstract relationName(
        columnName: string,
        relation: RelationInfo,
        dbModel: EntityInfo[]
    ): string;

    public abstract entityName(entityName: string, entity?: EntityInfo): string;

    public abstract columnName(columnName: string, column?: ColumnInfo): string;
}
