import { PrimaryColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable } from "typeorm";
import {Post} from "./Post";

@Entity("PostAuthor")
export class PostAuthor {


    @PrimaryColumn("int")
    id: number;

    @PrimaryColumn()
    type: string;


    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.postAuthors)
    posts: Post[];

}
