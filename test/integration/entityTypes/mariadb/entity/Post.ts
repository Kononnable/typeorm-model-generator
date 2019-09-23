import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("Post")
export class Post {
    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column("bit")
    bit: boolean;

    @Column("int")
    int: number;

    @Column("tinyint")
    tinyint: number;

    @Column("tinyint", { width: 1 })
    boolean: boolean;

    @Column("smallint")
    smallint: number;

    @Column("mediumint")
    mediumint: number;

    @Column("bigint")
    bigint: string;

    @Column("float")
    float: number;

    @Column("double")
    double: number;

    @Column("decimal")
    decimal: string;

    @Column("date")
    date: string;

    @Column("datetime")
    datetime: Date;

    @Column("timestamp")
    timestamp: Date;

    @Column("time")
    time: string;

    @Column("year")
    year: number;

    @Column("char")
    char: string;

    @Column("varchar")
    varchar: string;

    @Column("blob")
    blob: Buffer;

    @Column("text")
    text: string;

    @Column("tinyblob")
    tinyblob: Buffer;

    @Column("tinytext")
    tinytext: string;

    @Column("mediumblob")
    mediumblob: Buffer;

    @Column("mediumtext")
    mediumtext: string;

    @Column("longblob")
    longblob: Buffer;

    @Column("longtext")
    longtext: string;

    @Column("enum", { enum: ["A", "B", "C"] })
    enum: "A" | "B" | "C";

    // In mariaDb Json is recognized as longtext
    // @Column("json")
    // json: object;

    @Column("binary")
    binary: Buffer;

    @Column("geometry")
    geometry: string;

    @Column("point")
    point: string;

    @Column("linestring")
    linestring: string;

    @Column("polygon")
    polygon: string;

    @Column("multipoint")
    multipoint: string;

    @Column("multilinestring")
    multilinestring: string;

    @Column("multipolygon")
    multipolygon: string;

    @Column("geometrycollection")
    geometrycollection: string;
}
