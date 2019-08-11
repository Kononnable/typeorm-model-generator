export default class IConnectionOptions {
    public host: string = "";

    public port: number = 0;

    public databaseName: string = "";

    public user: string = "";

    public password: string = "";

    public databaseType: string = "";

    public schemaName: string = "";

    public ssl: boolean = false;

    public timeout?: number;
}
