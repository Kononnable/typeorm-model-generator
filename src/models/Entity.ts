import { Column } from "./Column";
import { Relation } from "./Relation";
import { Index } from "./Index";
import { RelationId } from "./RelationId";

export type Entity = {
    sqlName: string;
    tscName: string;

    database?: string;
    schema?: string;

    columns: Column[];
    relationIds: RelationId[];
    relations: Relation[];
    indices: Index[];
    // TODO: move to sub-object or use handlebars helpers(?)
    fileName: string;
    fileImports: {
        entityName: string;
        fileName: string;
    }[];
    activeRecord?: true;
    generateConstructor?: true;
};
