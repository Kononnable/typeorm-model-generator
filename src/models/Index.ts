export type Index = {
    name: string;
    columns: string[];
    options: {
        unique?: boolean;
    };
    primary?: boolean;
};
