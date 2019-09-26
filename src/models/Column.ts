import { ColumnType } from "typeorm";

export type Column = {
    primary?: boolean;

    sqlType: ColumnType;

    typescriptType: any;

    name?: string;

    length?: number;

    width?: number;

    nullable?: boolean;

    generated?: true | "increment" | "uuid";

    unique?: boolean;

    default?: boolean;

    precision?: number;

    scale?: number;

    unsigned?: boolean;

    enum?: string[];

    array?: boolean;
};
