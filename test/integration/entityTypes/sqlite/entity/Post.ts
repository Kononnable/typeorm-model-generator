import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("Post")
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column("int")
    int: number;

    @Column("integer")
    integer: number;

    @Column("int2")
    int2: number;

    @Column("int8")
    int8: number;

    @Column("tinyint")
    tinyint: number;

    @Column("smallint")
    smallint: number;

    @Column("mediumint")
    mediumint: number;

    @Column("bigint")
    bigint: string;

    @Column("unsigned big int")
    unsigned_big_int: string;

    @Column("character")
    character: string;

    @Column("varchar")
    varchar: string;

    @Column("varying character")
    varying_character: string;

    @Column("nchar")
    nchar: string;

    @Column("native character")
    native_character: string;

    @Column("nvarchar")
    nvarchar: string;

    @Column("text")
    text: string;

    @Column("blob")
    blob: Buffer;

    @Column("clob")
    clob: string;

    @Column("real")
    real: number;
    @Column("double")
    double: number;

    @Column("double precision")
    doublePrecision: number;

    @Column("float")
    float: number;

    @Column("numeric")
    numeric: number;

    @Column("decimal")
    decimal: number;

    @Column("boolean")
    boolean: boolean;

    @Column("date")
    date: string;

    @Column("datetime")
    datetime: Date;

}
