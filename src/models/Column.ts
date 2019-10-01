import { ColumnType } from "typeorm";

export type Column = {
    tscType: any;
    tscName: string;

    primary?: boolean;
    generated?: true | "increment" | "uuid";
    options: {
        type: ColumnType;
        name: string;
        length?: number;
        width?: number;
        nullable?: boolean;
        unique?: boolean; // ?
        default?: boolean;
        precision?: number;
        scale?: number;
        unsigned?: boolean;
        enum?: string[];
        array?: boolean; // ?
    };
};
