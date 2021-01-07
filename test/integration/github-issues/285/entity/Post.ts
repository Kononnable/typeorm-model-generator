import { PrimaryGeneratedColumn, Column, Entity, OneToOne, JoinColumn, Index } from "typeorm";

@Index("my_index", ["title"], { fulltext: true })
@Entity("Post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;


    @Column("varchar")
    title: string;
}
