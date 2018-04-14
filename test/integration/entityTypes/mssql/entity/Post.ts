import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("Post")
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column("bigint")
    bigint: string;

    @Column("bit")
    bit: boolean;

    @Column("decimal")
    decimal: number;

    @Column("int")
    int: number;

    @Column("money")
    money: number;

    @Column("numeric")
    numeric: number;

    @Column("smallint")
    smallint: number;

    @Column("smallmoney")
    smallmoney: number;

    @Column("tinyint")
    tinyint: number;

    @Column("float")
    float: number;

    @Column("real")
    real: number;

    @Column("date")
    dateObj: Date;

    @Column("datetime2")
    datetime2: Date;

    @Column("datetime")
    datetime: Date;

    @Column("datetimeoffset")
    datetimeoffset: Date;

    @Column("smalldatetime")
    smalldatetime: Date;

    @Column("time")
    timeObj: Date;

    @Column("char")
    char: string;

    @Column("text")
    text: string;

    @Column("varchar")
    varchar: string;

    @Column("nchar")
    nchar: string;

    @Column("ntext")
    ntext: string;

    @Column("nvarchar")
    nvarchar: string;

    @Column("binary")
    binary: Buffer;

    @Column("image")
    image: Buffer;

    @Column("varbinary")
    varbinary: Buffer;

    @Column("hierarchyid")
    hierarchyid: string;

    @Column("sql_variant")
    sql_variant: string;

    @Column("timestamp")
    timestamp: Date;

    @Column("uniqueidentifier")
    uniqueidentifier: string;

    @Column("xml")
    xml: string;

    @Column("geometry")
    geometry: string;

    @Column("geography")
    geography: string;

}
