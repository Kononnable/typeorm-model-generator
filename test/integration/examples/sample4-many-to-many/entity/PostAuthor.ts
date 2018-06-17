import { PrimaryGeneratedColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable } from "typeorm";
import {Post} from "./Post";

@Entity("PostAuthor")
export class PostAuthor {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.postAuthors)
    posts: Post[];

}
