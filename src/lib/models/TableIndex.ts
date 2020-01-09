export type TableIndex = {
    name: string;
    columns: string[];
    options: {
        unique?: boolean;
    };
    primary?: boolean;
};
