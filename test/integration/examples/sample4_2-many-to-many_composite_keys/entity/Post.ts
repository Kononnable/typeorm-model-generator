import { PrimaryColumn, Column, Entity, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable } from "typeorm";
import {PostAuthor} from "./PostAuthor";

@Entity("Post")
export class Post {

    @PrimaryColumn("int")
    id: number;

    @PrimaryColumn()
    type: string;

    // post has relation with details. not cascades here. means cannot be persisted, updated or removed
    @ManyToMany(type => PostAuthor, author => author.posts)
    @JoinTable()
    postAuthors: PostAuthor[];

}
