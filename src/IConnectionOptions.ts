// TODO: change name

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export default interface IConnectionOptions {
    host: string;
    port: number;
    databaseName: string;
    user: string;
    password: string;
    databaseType:
        | "mssql"
        | "postgres"
        | "mysql"
        | "mariadb"
        | "oracle"
        | "sqlite";
    schemaName: string;
    ssl: boolean;
    skipTables: string[];
}

export function getDefaultConnectionOptions(): IConnectionOptions {
    const connectionOptions: IConnectionOptions = {
        host: "127.0.0.1",
        port: 0,
        databaseName: "",
        user: "",
        password: "",
        databaseType: undefined as any,
        schemaName: "",
        ssl: false,
        skipTables: []
    };
    return connectionOptions;
}
