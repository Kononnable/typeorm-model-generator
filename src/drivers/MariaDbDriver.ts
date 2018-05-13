import { MysqlDriver } from "./MysqlDriver";

export class MariaDbDriver extends MysqlDriver {
    readonly EngineName: string = "MariaDb";
}
