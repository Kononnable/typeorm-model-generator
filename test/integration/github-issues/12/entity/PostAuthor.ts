import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";

@Entity("PostAuthor")
export class PostAuthor {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Post, post => post.author)
    posts: Post[];

    @OneToMany(type => Post, post => post.author2)
    posts2: Post[];

}
