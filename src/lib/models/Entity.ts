import { Column } from "./Column";
import { Relation } from "./Relation";
import { TableIndex } from "./TableIndex";
import { RelationId } from "./RelationId";

export type Entity = {
    sqlName: string;
    tscName: string;

    database?: string;
    schema?: string;

    columns: Column[];
    relationIds: RelationId[];
    relations: Relation[];
    indices: TableIndex[];
    // TODO: move to sub-object or use handlebars helpers(?)
    fileImports: string[];
    activeRecord?: true;
    generateConstructor?: true;
};
