import { PrimaryGeneratedColumn, Column, Entity, OneToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";

@Entity("PostAuthor", {database: "db2"})
export class PostAuthor {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Post, post => post.author)
    post: Post;

}
