import MysqlDriver from "./MysqlDriver";

export default class MariaDbDriver extends MysqlDriver {
    public readonly EngineName: string = "MariaDb";
}
