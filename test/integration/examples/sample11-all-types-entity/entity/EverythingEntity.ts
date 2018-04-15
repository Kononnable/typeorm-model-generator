import { PrimaryGeneratedColumn, Column, Entity, OneToOne, JoinColumn, Index } from "typeorm";

@Entity("EverythingEntity")
export class EverythingEntity {
    //TODO: change to check column types per database engine
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    // @Column("text")
    // text: string;

    @Column({ length: 32 })
    shortTextColumn: string;

    @Column()
    numberColumn: number;

    @Column("integer")
    integerColumn: number;

    @Column("int")
    intColumn: number;

    @Column("smallint")
    smallintColumn: number;

    // @Column("bigint")
    // bigintColumn: number;

    // @Column("float")
    // floatColumn: number;

    // @Column("double")
    // doubleColumn: number;

    // @Column("decimal")
    // decimalColumn: number;

    @Column()
    date: Date;

    // @Column("date")
    // dateColumn: Date;

    // @Column("time")
    // timeColumn: Date;

    // @Column("boolean")
    // isBooleanColumn: boolean;

    // @Column("boolean")
    // isSecondBooleanColumn: boolean;

    // @Column("json")
    // jsonColumn: any;

    // @Column()
    // alsoJson: any;

    // @Column("simple_array")
    // simpleArrayColumn: string[];

    // @CreateDateColumn()
    // createdDate: Date;

    // @UpdateDateColumn()
    // updatedDate: Date;

}
