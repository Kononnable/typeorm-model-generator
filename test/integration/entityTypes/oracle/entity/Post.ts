import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("Post")
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column("char")
    char: string;

    @Column("nchar")
    nchar: string;

    @Column("nvarchar2")
    nvarchar2: string;

    @Column("varchar2")
    varchar2: string;

    @Column("long")
    long: string;

    @Column("raw")
    raw: Buffer;

    // @Column("long raw")
    // long_raw: Buffer;

    @Column("number")
    number: number;

    @Column("numeric")
    numeric: number;

    @Column("float")
    float: number;

    @Column("dec")
    dec: number;

    @Column("decimal")
    decimal: number;

    @Column("integer")
    integer: number;

    @Column("int")
    int: number;

    @Column("smallint")
    smallint: number;

    @Column("real")
    real: number;

    @Column("double precision")
    double_precision: number;

    @Column("date")
    date: Date;

    @Column("timestamp")
    timestamp: Date;

    @Column("timestamp with time zone")
    timestamp_with_time_zone: Date;

    @Column("timestamp with local time zone")
    timestamp_with_local_time_zone: Date;

    @Column("interval year to month")
    interval_year_to_month: string;

    @Column("interval day to second")
    interval_day_to_second: string;

    @Column("bfile")
    bfile: Buffer;

    @Column("blob")
    blob: Buffer;

    @Column("clob")
    clob: string;

    @Column("nclob")
    nclob: string;

    @Column("rowid")
    rowid: number;

    @Column("urowid")
    urowid: number;

}
