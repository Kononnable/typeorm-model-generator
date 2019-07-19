import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("PostArrays")
export class PostArrays {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column("int2", { array: true })
    int2: number[];

    @Column("int4", { array: true })
    int4: number[];

    @Column("int8", { array: true })
    int8: string[];

    @Column("smallint", { array: true })
    smallint: number[];

    @Column("integer", { array: true })
    integer: number[];

    @Column("bigint", { array: true })
    bigint: string[];

    @Column("decimal", { array: true })
    decimal: string[];

    @Column("numeric", { array: true })
    numeric: string[];

    @Column("real", { array: true })
    real: number[];

    @Column("float", { array: true })
    float: number[];

    @Column("float4", { array: true })
    float4: number[];

    @Column("float8", { array: true })
    float8: number[];

    @Column("double precision", { array: true })
    doublePrecision: number[];

    @Column("money", { array: true })
    money: string[];

    @Column("character varying", { array: true })
    characterVarying: string[];

    @Column("varchar", { array: true })
    varchar: string[];

    @Column("character", { array: true })
    character: string[];

    @Column("char", { array: true })
    char: string[];

    @Column("text", { array: true })
    text: string[];

    @Column("citext", { array: true })
    citext: string[];

    @Column("hstore", { array: true })
    hstore: string[];

    @Column("bytea", { array: true })
    bytea: Buffer[];

    @Column("bit", { array: true })
    bit: string[];

    @Column("varbit", { array: true })
    varbit: string[];

    @Column("bit varying", { array: true })
    bit_varying: string[];

    @Column("timetz", { array: true })
    timetz: string[];

    @Column("timestamptz", { array: true })
    timestamptz: Date[];

    // @Column("timestamp", { array: true })
    // timestamp: Date[];

    // @Column("timestamp without time zone", { array: true })
    // timestamp_without_time_zone: Date[];

    @Column("timestamp with time zone", { array: true })
    timestamp_with_time_zone: Date[];

    @Column("date", { array: true })
    date: string[];

    @Column("time", { array: true })
    time: string[];
    @Column("time without time zone", { array: true })
    time_without_time_zone: string[];

    @Column("time with time zone", { array: true })
    time_with_time_zone: string[];

    @Column("interval", { array: true })
    interval: any[];

    @Column("bool", { array: true })
    bool: boolean[];

    @Column("boolean", { array: true })
    boolean: boolean[];

    // @Column("enum", { array: true })
    // enum: string[];

    @Column("point", { array: true })
    point: string[] | object[];

    @Column("line", { array: true })
    line: string[];

    @Column("lseg", { array: true })
    lseg: string[] | string[][];

    @Column("box", { array: true })
    box: string[] | object[];

    @Column("path", { array: true })
    path: string[];

    @Column("polygon", { array: true })
    polygon: string[];

    @Column("circle", { array: true })
    circle: string[] | object[];

    @Column("cidr", { array: true })
    cidr: string[];

    @Column("inet", { array: true })
    inet: string[];

    @Column("macaddr", { array: true })
    macaddr: string[];

    @Column("tsvector", { array: true })
    tsvector: string[];

    @Column("tsquery", { array: true })
    tsquery: string[];

    @Column("uuid", { array: true })
    uuid: string[];

    @Column("xml", { array: true })
    xml: string[];

    @Column("json", { array: true })
    json: object[];

    @Column("jsonb", { array: true })
    jsonb: object[];

    @Column("int4range", { array: true })
    int4range: string[];

    @Column("int8range", { array: true })
    int8range: string[];

    @Column("numrange", { array: true })
    numrange: string[];

    @Column("tsrange", { array: true })
    tsrange: string[];

    @Column("tstzrange", { array: true })
    tstzrange: string[];

    @Column("daterange", { array: true })
    daterange: string[];

}
