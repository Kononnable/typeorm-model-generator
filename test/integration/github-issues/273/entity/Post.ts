import { PrimaryGeneratedColumn, Column, Entity, OneToOne, JoinColumn, Index } from "typeorm";
import { PostAuthor } from "./PostAuthor";

@Entity("Post", {database: "db-1"})
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @OneToOne(type => PostAuthor, author => author.post)
    @JoinColumn()
    author: PostAuthor;

}
