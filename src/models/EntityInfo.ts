import { ColumnInfo } from './ColumnInfo'
/**
 * EntityInfo
 */
export class EntityInfo {
    EntityName: string;
    Columns: ColumnInfo[];
    Imports: string[];
    Indexes: IndexInfo[];
}
