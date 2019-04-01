import { MysqlDriver } from "./MysqlDriver";

export class MariaDbDriver extends MysqlDriver {
    public readonly EngineName: string = "MariaDb";
}
