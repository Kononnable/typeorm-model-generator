import { PrimaryGeneratedColumn, Column, Entity, OneToOne, JoinColumn, Index } from "typeorm";

@Entity("Post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("json", {
        default: { type: null, values: true }
    })
    data: object;

    @Column("jsonb", {
        default: { type: null, values: true }
    })
    data2: object;

    @Column()
    text: string;

}
