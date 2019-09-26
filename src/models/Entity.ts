import { Column } from "./Column";
import { Relation } from "./Relation";
import { Index } from "./Index";

export type Entity = {
    sqlName: string;
    typescriptName?: string;

    database?: string;
    schema?: string;

    columns: Column[];
    relations?: Relation[];
    indices?: Index[];
};
