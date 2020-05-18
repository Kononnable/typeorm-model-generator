import { Column } from "./Column";
import { Index } from "./Index";
import { Relation } from "./Relation";
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
    fileImports: string[];
    activeRecord?: true;
    generateConstructor?: true;
    graphql?: true;
};
