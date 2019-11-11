import { RelationOptions } from "typeorm";

export type RelationId = {
    fieldName: string;
    fieldType: string;
    relationOptions?: RelationOptions;
    relationField: string;
};
