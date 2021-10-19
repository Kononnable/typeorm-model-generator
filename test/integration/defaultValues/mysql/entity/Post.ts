import {
    PrimaryGeneratedColumn,
    Column,
    Entity,
    OneToOne,
    OneToMany,
    ManyToOne,
    JoinColumn,
    UpdateDateColumn
} from "typeorm";

@Entity("Post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("timestamp",{
        default: () => "CURRENT_TIMESTAMP",
        })
    createdAt:Date;

    @Column("varchar",{
        length: 30,
        default: () => "'defVal'",
        })
    text:string;

    @Column("varchar",{
        length: 30,
        default: () => "''",
    })
    blankDefault:string;

}
