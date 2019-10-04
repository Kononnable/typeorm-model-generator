import { ColumnType } from "typeorm";

export type Column = {
    tscType: any;
    tscName: string;
    type: ColumnType | string; // todo: remove ?

    primary?: boolean;
    generated?: true | "increment" | "uuid";
    default?: string; // ?
    options: {
        name: string;
        length?: number;
        width?: number;
        nullable?: boolean;
        unique?: boolean; // ?
        precision?: number;
        scale?: number;
        unsigned?: boolean;
        enum?: string[];
        array?: boolean; // ?
    };
};
