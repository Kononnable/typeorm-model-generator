import { PrimaryGeneratedColumn, Column, Entity, OneToOne, JoinColumn, Index } from "typeorm";
import { PostAuthor } from "./PostAuthor";

@Entity("Post", {database: "db1"})
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    // post has relation with details. not cascades here. means cannot be persisted, updated or removed
    @OneToOne(type => PostAuthor, author => author.post)
    @JoinColumn()
    // @Index({ unique: true })
    author: PostAuthor;

}
