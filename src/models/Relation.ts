import { OnUpdateType } from "typeorm/metadata/types/OnUpdateType";
import { OnDeleteType } from "typeorm/metadata/types/OnDeleteType";
import { RelationType } from "typeorm/metadata/types/RelationTypes";
import { JoinTableOptions, JoinColumnOptions } from "typeorm";
import { JoinTableMultipleColumnsOptions } from "typeorm/decorator/options/JoinTableMultipleColumnsOptions";

export type Relation = {
    target: Function | string;
    type: RelationType;
    inverseSide?: string;
    // lazy?: boolean;
    // eager?: boolean;
    // primary?: boolean;
    joinTable?: boolean | JoinTableOptions | JoinTableMultipleColumnsOptions;
    joinColumn?: boolean | JoinColumnOptions;
    nullable?: boolean;
    onDelete?: OnDeleteType;
    onUpdate?: OnUpdateType;
};
