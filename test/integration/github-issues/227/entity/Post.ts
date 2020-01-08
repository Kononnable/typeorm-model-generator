import { PrimaryGeneratedColumn, Column, Entity, OneToOne, JoinColumn, Index } from "typeorm";

@Entity("Post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { nullable: true })
    title: string | null;

    @Column()
    text: string;

}
