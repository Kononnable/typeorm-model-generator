import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";

@Entity("PostAuthor")
export class PostAuthor {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author)
    posts: Post[];

}
