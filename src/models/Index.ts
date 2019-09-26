export type Index = {
    name?: string;
    columns?: ((object?: any) => any[] | { [key: string]: number }) | string[];
    unique?: boolean;
};
