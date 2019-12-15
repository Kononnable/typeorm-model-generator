import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("Post")
export class Post {
    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column("int2")
    int2: number;

    @Column("int4")
    int4: number;

    @Column("int8")
    int8: string;

    @Column("smallint")
    smallint: number;

    @Column("integer")
    integer: number;

    @Column("bigint")
    bigint: string;

    @Column("decimal")
    decimal: string;

    @Column("numeric")
    numeric: string;

    @Column("real")
    real: number;

    @Column("float")
    float: number;

    @Column("float4")
    float4: number;

    @Column("float8")
    float8: number;

    @Column("double precision")
    doublePrecision: number;

    @Column("money")
    money: string;

    @Column("character varying")
    characterVarying: string;

    @Column("varchar")
    varchar: string;

    @Column("character")
    character: string;

    @Column("char")
    char: string;

    @Column("text")
    text: string;

    @Column("citext")
    citext: string;

    @Column("hstore")
    hstore: string;

    @Column("bytea")
    bytea: Buffer;

    @Column("bit")
    bit: string;

    @Column("varbit")
    varbit: string;

    @Column("bit varying")
    bit_varying: string;

    @Column("timetz")
    timetz: string;

    @Column("timestamptz")
    timestamptz: Date;

    @Column("timestamp")
    timestamp: Date;

    @Column("timestamp without time zone")
    timestamp_without_time_zone: Date;

    @Column("timestamp with time zone")
    timestamp_with_time_zone: Date;

    @Column("date")
    date: string;

    @Column("time")
    time: string;
    @Column("time without time zone")
    time_without_time_zone: string;

    @Column("time with time zone")
    time_with_time_zone: string;

    @Column("interval")
    interval: any;

    @Column("bool")
    bool: boolean;

    @Column("boolean")
    boolean: boolean;

    @Column("enum", { enum: ["A", "B", "C"] })
    enum: "A" | "B" | "C";

    @Column("point")
    point: string | object;

    @Column("line")
    line: string;

    @Column("lseg")
    lseg: string | string[];

    @Column("box")
    box: string | object;

    @Column("path")
    path: string;

    @Column("polygon")
    polygon: string;

    @Column("circle")
    circle: string | object;

    @Column("cidr")
    cidr: string;

    @Column("inet")
    inet: string;

    @Column("macaddr")
    macaddr: string;

    @Column("tsvector")
    tsvector: string;

    @Column("tsquery")
    tsquery: string;

    @Column("uuid")
    uuid: string;

    @Column("xml")
    xml: string;

    @Column("json")
    json: object;

    @Column("jsonb")
    jsonb: object;

    @Column("int4range")
    int4range: string;

    @Column("int8range")
    int8range: string;

    @Column("numrange")
    numrange: string;

    @Column("tsrange")
    tsrange: string;

    @Column("tstzrange")
    tstzrange: string;

    @Column("daterange")
    daterange: string;

    @Column("geography")
    geography: string;
}
