import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, JoinColumn } from "typeorm";

@Entity("Post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("timestamp",{
        default: () => "now()",
        })
    createdAt:Date;


    @Column("varchar",{
        length: 30,
        default: () => "'defVal'",
        })
    text:string;

}
