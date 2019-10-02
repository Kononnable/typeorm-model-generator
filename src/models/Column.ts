import { ColumnType } from "typeorm";

export type Column = {
    tscType: any;
    tscName: string;

    primary?: boolean;
    generated?: true | "increment" | "uuid";
    options: {
        type: ColumnType | string; // todo: remove ?
        name: string;
        length?: number;
        width?: number;
        nullable?: boolean;
        unique?: boolean; // ?
        default?: string; // ?
        precision?: number;
        scale?: number;
        unsigned?: boolean;
        enum?: string; // string[];
        array?: boolean; // ?
    };
};
